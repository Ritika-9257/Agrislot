const db = require('../config/database');
const BookingRepository = require('../repositories/booking.repository');
const SlotRepository = require('../repositories/slot.repository');
const FarmerRepository = require('../repositories/farmer.repository');
const ProduceRepository = require('../repositories/produce.repository');
const UserRepository = require('../repositories/user.repository');
const { generateToken } = require('../utils/tokenGenerator');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const AuditService = require('./audit.service');
const NotificationService = require('./notification.service');

const BookingService = {
  /**
   * Concurrency-safe atomic booking creation with row-level locking
   * One farmer account represents one farmer identity.
   */
  async createBooking({ Farmer_ID, Slot_ID, Produce_ID, Estimated_Weight_Tons }, authUser = null) {
    const requestedWeight = parseFloat(Estimated_Weight_Tons);
    if (isNaN(requestedWeight) || requestedWeight <= 0) {
      throw new AppError('Estimated weight must be a positive number', 400, 'INVALID_WEIGHT');
    }

    // 1. Authoritative Farmer Identity Resolution
    let resolvedFarmerId = null;
    if (authUser && authUser.userId) {
      const user = await UserRepository.findById(authUser.userId);
      if (!user) {
        throw new AppError('Authenticated user account not found', 401, 'USER_NOT_FOUND');
      }

      if (user.User_Role === 'Farmer' || user.Farmer_ID) {
        if (user.Farmer_ID) {
          resolvedFarmerId = user.Farmer_ID;
        } else {
          const derivedName = user.Full_Name || user.Username;
          const derivedPhone = '9' + String(user.User_ID).padStart(9, '0');
          const derivedAadhar = '9' + String(user.User_ID).padStart(11, '0');
          let farmerRecord = await FarmerRepository.findByPhone(derivedPhone);
          if (!farmerRecord) {
            const newId = await FarmerRepository.create({
              Name: derivedName,
              Phone: derivedPhone,
              Aadhar_No: derivedAadhar,
              UPI_ID: `${user.Username}@upi`,
              Village: 'Mandi Area'
            });
            resolvedFarmerId = newId;
          } else {
            resolvedFarmerId = farmerRecord.Farmer_ID;
          }
          await UserRepository.linkFarmer(user.User_ID, resolvedFarmerId);
        }
      } else if (user.User_Role === 'Admin') {
        resolvedFarmerId = Farmer_ID || user.Farmer_ID || 1;
      }
    } else {
      resolvedFarmerId = Farmer_ID;
    }

    if (!resolvedFarmerId) {
      throw new AppError('Farmer identity could not be resolved. Please log in.', 400, 'FARMER_REQUIRED');
    }

    // 2. Verify existence of Farmer and Produce before starting connection transaction
    const farmer = await FarmerRepository.findById(resolvedFarmerId);
    if (!farmer) {
      throw new AppError(`Farmer with ID ${resolvedFarmerId} does not exist`, 404, 'FARMER_NOT_FOUND');
    }

    const produce = await ProduceRepository.findById(Produce_ID);
    if (!produce) {
      throw new AppError(`Produce with ID ${Produce_ID} does not exist`, 404, 'PRODUCE_NOT_FOUND');
    }

    // 2. Open dedicated database connection for atomic transaction
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 3. Acquire row-level exclusive lock on the slot (SELECT ... FOR UPDATE)
      const slot = await SlotRepository.findByIdForUpdate(Slot_ID, connection);
      if (!slot) {
        throw new AppError(`Slot with ID ${Slot_ID} does not exist`, 404, 'SLOT_NOT_FOUND');
      }

      // 4. Validate slot date (cannot book past date)
      const todayStr = new Date().toISOString().split('T')[0];
      const slotDateStr = typeof slot.Slot_Date === 'string' 
        ? slot.Slot_Date.split('T')[0] 
        : new Date(slot.Slot_Date).toISOString().split('T')[0];

      if (slotDateStr < todayStr) {
        throw new AppError(`Cannot book slot for past date (${slotDateStr})`, 400, 'PAST_DATE_NOT_BOOKABLE');
      }

      // 5. Concurrency & capacity check
      const maxCapacity = parseFloat(slot.Max_Capacity_Tons);
      const bookedCapacity = parseFloat(slot.Booked_Capacity_Tons);
      const remainingCapacity = maxCapacity - bookedCapacity;

      if (requestedWeight > remainingCapacity) {
        throw new AppError(
          `Insufficient slot capacity. Requested: ${requestedWeight} tons, Available: ${remainingCapacity.toFixed(2)} tons`,
          409,
          'INSUFFICIENT_CAPACITY'
        );
      }

      // 6. Generate collision-resistant digital gate-pass token with retry mechanism
      let tokenNumber = null;
      let bookingId = null;
      let attempts = 0;
      const MAX_ATTEMPTS = 5;

      while (!bookingId && attempts < MAX_ATTEMPTS) {
        attempts++;
        tokenNumber = generateToken('AG-T');
        try {
          bookingId = await BookingRepository.create({
            Farmer_ID: resolvedFarmerId,
            Slot_ID,
            Produce_ID,
            Estimated_Weight_Tons: requestedWeight,
            Token_Number: tokenNumber
          }, connection);
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY' && err.message.includes('Token_Number')) {
            logger.warn(`Token collision on ${tokenNumber}, retrying (${attempts}/${MAX_ATTEMPTS})...`);
            continue;
          }
          throw err;
        }
      }

      if (!bookingId) {
        throw new AppError('Unable to generate unique gate pass token after several attempts', 500, 'TOKEN_GENERATION_FAILED');
      }

      // 7. Atomically increment slot booked capacity
      await SlotRepository.incrementBookedCapacity(Slot_ID, requestedWeight, connection);

      // 8. Commit atomic transaction
      await connection.commit();

      logger.info(`Booking created successfully: ID=${bookingId}, Token=${tokenNumber}, Weight=${requestedWeight}T`);

      NotificationService.notify({
        farmerId: resolvedFarmerId,
        title: `Gate-Pass ${tokenNumber} Confirmed`,
        message: `Arrival window reserved for ${requestedWeight}T ${produce.Produce_Name}. Gate-pass token: ${tokenNumber}`,
        type: 'BOOKING_CONFIRMED',
        entityType: 'Booking',
        entityId: bookingId
      });

      return {
        bookingId,
        tokenNumber,
        bookingStatus: 'Confirmed',
        estimatedWeightTons: requestedWeight,
        farmerId: resolvedFarmerId,
        farmerName: farmer.Name,
        slotId: Slot_ID,
        slotDate: slotDateStr,
        produceId: Produce_ID,
        produceName: produce.Produce_Name
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  /**
   * Concurrency-safe cancellation releasing capacity exactly once
   */
  async cancelBooking(bookingId, requestingUser = null) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Lock booking row
      const booking = await BookingRepository.findByIdForUpdate(bookingId, connection);
      if (!booking) {
        throw new AppError(`Booking with ID ${bookingId} not found`, 404, 'BOOKING_NOT_FOUND');
      }

      // Authorization check: If caller is authenticated as a Farmer, they can only cancel their own booking
      if (requestingUser && requestingUser.role === 'Farmer' && requestingUser.farmerId) {
        if (booking.Farmer_ID !== requestingUser.farmerId) {
          throw new AppError('Forbidden: You can only cancel your own bookings', 403, 'FORBIDDEN');
        }
      }

      // Validate cancellation eligibility
      if (booking.Booking_Status === 'Cancelled') {
        throw new AppError('Booking is already cancelled. Capacity has already been released.', 409, 'ALREADY_CANCELLED');
      }

      if (booking.Booking_Status === 'Completed') {
        throw new AppError('Cannot cancel a completed booking. Produce has already been processed.', 400, 'CANNOT_CANCEL_COMPLETED');
      }

      if (booking.Booking_Status === 'Checked-In') {
        throw new AppError('Cannot cancel a booking that has already checked in at the mandi gate.', 400, 'CANNOT_CANCEL_CHECKED_IN');
      }

      if (booking.Booking_Status !== 'Confirmed') {
        throw new AppError(`Cannot cancel booking with status: ${booking.Booking_Status}`, 400, 'INVALID_CANCELLATION_STATUS');
      }

      // Lock slot row to safely decrement capacity
      const slot = await SlotRepository.findByIdForUpdate(booking.Slot_ID, connection);
      if (!slot) {
        throw new AppError(`Associated slot with ID ${booking.Slot_ID} not found`, 404, 'SLOT_NOT_FOUND');
      }

      // 1. Update status to Cancelled
      await BookingRepository.updateStatus(bookingId, 'Cancelled', connection);

      // 2. Decrement slot capacity atomically
      const weightToRelease = parseFloat(booking.Estimated_Weight_Tons);
      await SlotRepository.decrementBookedCapacity(booking.Slot_ID, weightToRelease, connection);

      // 3. Commit
      await connection.commit();

      logger.info(`Booking ${bookingId} cancelled. Released ${weightToRelease}T back to Slot ${booking.Slot_ID}`);

      // 4. Record audit history
      AuditService.logAudit({
        tableName: 'Bookings',
        operationType: 'CANCEL',
        recordId: bookingId,
        oldData: { Booking_Status: booking.Booking_Status, Estimated_Weight_Tons: booking.Estimated_Weight_Tons },
        newData: { Booking_Status: 'Cancelled', Released_Capacity_Tons: weightToRelease },
        changedBy: requestingUser ? (requestingUser.username || requestingUser.role) : 'system'
      });

      NotificationService.notify({
        farmerId: booking.Farmer_ID,
        title: `Booking #${bookingId} Cancelled`,
        message: `Slot reservation for ${booking.Token_Number} has been cancelled and ${weightToRelease}T capacity restored.`,
        type: 'BOOKING_CANCELLED',
        entityType: 'Booking',
        entityId: bookingId
      });

      return {
        bookingId,
        tokenNumber: booking.Token_Number,
        bookingStatus: 'Cancelled',
        releasedCapacityTons: weightToRelease
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async getBookingById(bookingId) {
    const booking = await BookingRepository.findById(bookingId);
    if (!booking) {
      throw new AppError(`Booking with ID ${bookingId} not found`, 404, 'BOOKING_NOT_FOUND');
    }
    return booking;
  },

  async getBookingByToken(token) {
    const booking = await BookingRepository.findByToken(token);
    if (!booking) {
      throw new AppError(`Booking with token ${token} not found`, 404, 'BOOKING_NOT_FOUND');
    }
    return booking;
  },

  async getAllBookings(filters) {
    return BookingRepository.findAll(filters);
  },

  /**
   * Admin booking status transition management
   */
  async updateBookingStatus(bookingId, newStatus, changedBy = 'admin') {
    const current = await BookingRepository.findById(bookingId);
    if (!current) {
      throw new AppError(`Booking with ID ${bookingId} not found`, 404, 'BOOKING_NOT_FOUND');
    }

    // If attempting to cancel via this endpoint, delegate to atomic cancel logic to release capacity
    if (newStatus === 'Cancelled') {
      return this.cancelBooking(bookingId, { username: changedBy, role: 'Admin' });
    }

    // Validate state machine transitions
    const validTransitions = {
      'Confirmed': ['Checked-In', 'Cancelled'],
      'Checked-In': ['Completed'],
      'Completed': [],
      'Cancelled': []
    };

    const allowed = validTransitions[current.Booking_Status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from '${current.Booking_Status}' to '${newStatus}'. Allowed: [${allowed.join(', ') || 'None'}]`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    await BookingRepository.updateStatus(bookingId, newStatus);

    AuditService.logAudit({
      tableName: 'Bookings',
      operationType: 'STATUS_UPDATE',
      recordId: bookingId,
      oldData: { Booking_Status: current.Booking_Status },
      newData: { Booking_Status: newStatus },
      changedBy
    });

    return {
      bookingId,
      previousStatus: current.Booking_Status,
      bookingStatus: newStatus
    };
  },

  /**
   * Fast-track gate check-in by token with automated weighbridge tare & gross calculation
   */
  async checkInByToken({ token, grossWeightKg, tareWeightKg, bay }) {
    if (!token) {
      throw new AppError('Gate-pass token is required for check-in', 400, 'TOKEN_REQUIRED');
    }
    const cleanToken = token.trim();
    const booking = await this.getBookingByToken(cleanToken);
    if (!booking) {
      throw new AppError(`No booking found matching token '${cleanToken}'`, 404, 'BOOKING_NOT_FOUND');
    }
    if (booking.Booking_Status === 'Cancelled') {
      throw new AppError('Cannot admit vehicle: Booking has been cancelled', 400, 'BOOKING_CANCELLED');
    }
    if (booking.Booking_Status === 'Completed') {
      throw new AppError('Cannot admit vehicle: Booking has already been completed and discharged', 400, 'BOOKING_ALREADY_COMPLETED');
    }
    if (booking.Booking_Status === 'Checked-In') {
      throw new AppError('Vehicle has already checked in at the weighbridge gate', 409, 'DUPLICATE_CHECK_IN');
    }

    const statusResult = await this.updateBookingStatus(booking.Booking_ID, 'Checked-In', 'weighbridge_operator');

    const declaredWeight = parseFloat(booking.Estimated_Weight_Tons) || 5.0;
    const gross = grossWeightKg ? parseFloat(grossWeightKg) : (declaredWeight * 1000 + 2920);
    const tare = tareWeightKg ? parseFloat(tareWeightKg) : 2920;
    const net = gross - tare;

    NotificationService.notify({
      farmerId: booking.Farmer_ID,
      title: `Gate 02 Vehicle Admitted — ${booking.Token_Number}`,
      message: `Cleared for ${bay || 'BAY 04 — BULK ONION DOCK'}. Net weight: ${(net / 1000).toFixed(2)}T.`,
      type: 'CHECKED_IN',
      entityType: 'Booking',
      entityId: booking.Booking_ID
    });

    return {
      ...statusResult,
      tokenNumber: booking.Token_Number,
      farmerId: booking.Farmer_ID,
      farmerName: booking.Farmer_Name,
      farmerPhone: booking.Farmer_Phone,
      produceName: booking.Produce_Name,
      mandiName: booking.Mandi_Name,
      bayAssigned: bay || 'BAY 04 — BULK ONION DOCK',
      grossWeightKg: gross,
      tareWeightKg: tare,
      netWeightKg: net,
      actualWeightTons: (net / 1000).toFixed(2),
      clearanceStatus: 'CLEARED_FOR_UNLOADING',
      checkInTimestamp: new Date().toISOString()
    };
  }
};

module.exports = BookingService;
