const SlotRepository = require('../repositories/slot.repository');
const AuditService = require('./audit.service');
const { AppError } = require('../middleware/errorHandler');

const SlotService = {
  async getAllSlots(filters) {
    return SlotRepository.findAll(filters);
  },

  async getSlotById(slotId) {
    const slot = await SlotRepository.findById(slotId);
    if (!slot) {
      throw new AppError(`Slot with ID ${slotId} not found`, 404, 'SLOT_NOT_FOUND');
    }
    return slot;
  },

  async getUtilization() {
    return SlotRepository.getUtilizationSummary();
  },

  async getSlotBookings(slotId) {
    const slot = await SlotRepository.findById(slotId);
    if (!slot) {
      throw new AppError(`Slot with ID ${slotId} not found`, 404, 'SLOT_NOT_FOUND');
    }
    const bookings = await SlotRepository.findBookingsForSlot(slotId);
    return {
      slot,
      bookings
    };
  },

  async updateSlotLimits(slotId, { maxBookings, maxCapacityTons, status }, requestingUser = null) {
    const existing = await SlotRepository.findById(slotId);
    if (!existing) {
      throw new AppError(`Slot with ID ${slotId} not found`, 404, 'SLOT_NOT_FOUND');
    }

    try {
      const updated = await SlotRepository.updateSlotLimits(slotId, {
        maxBookings,
        maxCapacityTons,
        status
      });

      // Audit trail
      AuditService.logAudit({
        tableName: 'Slots',
        operationType: 'UPDATE_LIMITS',
        recordId: slotId,
        oldData: {
          Max_Bookings: existing.Max_Bookings,
          Max_Capacity_Tons: existing.Max_Capacity_Tons,
          Slot_Status: existing.Slot_Status
        },
        newData: {
          Max_Bookings: updated.Max_Bookings,
          Max_Capacity_Tons: updated.Max_Capacity_Tons,
          Slot_Status: updated.Slot_Status
        },
        changedBy: requestingUser ? (requestingUser.username || requestingUser.role) : 'system'
      });

      return updated;
    } catch (err) {
      if (err.code === 'CANNOT_REDUCE_BELOW_BOOKED_COUNT' || err.code === 'CANNOT_REDUCE_BELOW_BOOKED_WEIGHT') {
        throw new AppError(err.message, 400, err.code);
      }
      throw err;
    }
  },

  async reconcileSlot(slotId = null) {
    return SlotRepository.reconcileSlot(slotId);
  }
};

module.exports = SlotService;
