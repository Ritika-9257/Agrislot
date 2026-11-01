const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const env = require('../src/config/env');
const db = require('../src/config/database');
const { closePool } = require('../src/config/database');
const BookingService = require('../src/services/booking.service');
const SlotRepository = require('../src/repositories/slot.repository');
const BookingRepository = require('../src/repositories/booking.repository');
const FarmerRepository = require('../src/repositories/farmer.repository');
const ProduceRepository = require('../src/repositories/produce.repository');

test('AgriSlot Booking System Test Suite', async (t) => {
  // Test Farmer token: Farmer_ID 31
  const farmerUser = {
    userId: 10,
    username: '9988011223',
    role: 'Farmer',
    farmerId: 31
  };
  const farmerToken = jwt.sign(farmerUser, env.JWT_SECRET, { expiresIn: '1h' });

  // Admin token
  const adminUser = {
    userId: 1,
    username: 'admin',
    role: 'Admin'
  };
  const adminToken = jwt.sign(adminUser, env.JWT_SECRET, { expiresIn: '1h' });

  // Other Farmer token: Farmer_ID 2
  const otherFarmerUser = {
    userId: 99,
    username: '9876543210',
    role: 'Farmer',
    farmerId: 2
  };

  await t.test('1. Unauthorized booking without authentication is rejected with 401', async () => {
    await assert.rejects(
      async () => {
        await BookingService.createBooking({
          Slot_ID: 26,
          Produce_ID: 1,
          Estimated_Weight_Tons: 5
        }, null);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.code, 'UNAUTHORIZED');
        return true;
      }
    );
  });

  await t.test('2. Successful booking creates booking, reserves capacity atomically, and returns GatePassModal fields', async () => {
    // Pick an operational slot with available capacity (e.g. Slot_ID 26)
    const slotBefore = await SlotRepository.findById(26);
    assert.ok(slotBefore, 'Slot 26 should exist');
    const initialBooked = parseFloat(slotBefore.Booked_Capacity_Tons);

    const bookingResult = await BookingService.createBooking({
      Mandi_ID: slotBefore.Mandi_ID,
      Slot_ID: 26,
      Produce_ID: 1,
      Estimated_Weight_Tons: 4.5
    }, farmerUser);

    assert.ok(bookingResult.bookingId, 'Booking ID must be returned');
    assert.ok(bookingResult.tokenNumber, 'Gate-pass token number must be returned');
    assert.ok(bookingResult.tokenNumber.startsWith('AG-T'), 'Token format should start with AG-T');
    assert.strictEqual(bookingResult.farmerId, 31, 'Farmer_ID must match authenticated user');
    assert.strictEqual(bookingResult.bookingStatus, 'Confirmed');
    assert.strictEqual(bookingResult.estimatedWeightTons, 4.5);
    assert.strictEqual(bookingResult.produceId, 1);
    assert.ok(bookingResult.farmerName, 'Farmer name should be included');
    assert.ok(bookingResult.mandiName, 'Mandi name should be included');
    assert.ok(bookingResult.produceName, 'Produce name should be included');

    // Verify slot capacity incremented by 4.5 tons
    const slotAfter = await SlotRepository.findById(26);
    const finalBooked = parseFloat(slotAfter.Booked_Capacity_Tons);
    assert.strictEqual(Math.round((finalBooked - initialBooked) * 100) / 100, 4.5);

    // Clean up created booking to restore capacity
    await BookingService.cancelBooking(bookingResult.bookingId, farmerUser);
  });

  await t.test('3. Spoofed Farmer_ID is ignored; backend strictly uses req.user.farmerId', async () => {
    const slot = await SlotRepository.findById(27);
    assert.ok(slot, 'Slot 27 should exist');

    // Attempt to spoof Farmer_ID as 999
    const bookingResult = await BookingService.createBooking({
      Farmer_ID: 999,
      farmerId: 999,
      Mandi_ID: slot.Mandi_ID,
      Slot_ID: 27,
      Produce_ID: 1,
      Estimated_Weight_Tons: 2.0
    }, farmerUser);

    // Must be assigned to farmerUser.farmerId (31), not 999
    assert.strictEqual(bookingResult.farmerId, 31);

    const savedInDb = await BookingRepository.findById(bookingResult.bookingId);
    assert.strictEqual(savedInDb.Farmer_ID, 31);

    // Clean up
    await BookingService.cancelBooking(bookingResult.bookingId, farmerUser);
  });

  await t.test('4. Mandi-Slot mismatch is rejected with 400 SLOT_MANDI_MISMATCH', async () => {
    // Slot 26 belongs to Mandi 1 (APMC Surat)
    // Pass Mandi_ID: 2 (APMC Ahmedabad)
    await assert.rejects(
      async () => {
        await BookingService.createBooking({
          Mandi_ID: 2, // Mismatch with Slot 26 which is Mandi 1
          Slot_ID: 26,
          Produce_ID: 1,
          Estimated_Weight_Tons: 3
        }, farmerUser);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'SLOT_MANDI_MISMATCH');
        return true;
      }
    );
  });

  await t.test('5. Non-existent slot is rejected with 404 SLOT_NOT_FOUND', async () => {
    await assert.rejects(
      async () => {
        await BookingService.createBooking({
          Slot_ID: 999999,
          Produce_ID: 1,
          Estimated_Weight_Tons: 3
        }, farmerUser);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 404);
        assert.strictEqual(err.code, 'SLOT_NOT_FOUND');
        return true;
      }
    );
  });

  await t.test('6. Weight exceeding remaining capacity is rejected with 409 INSUFFICIENT_CAPACITY', async () => {
    const slot = await SlotRepository.findById(28);
    const remaining = parseFloat(slot.Remaining_Capacity_Tons);

    await assert.rejects(
      async () => {
        await BookingService.createBooking({
          Slot_ID: 28,
          Produce_ID: 1,
          Estimated_Weight_Tons: remaining + 5.0
        }, farmerUser);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'INSUFFICIENT_CAPACITY');
        return true;
      }
    );
  });

  await t.test('7. Past date slot is rejected with 400 PAST_DATE_NOT_BOOKABLE', async () => {
    // Slot 1 has date 2026-10-12 (past date)
    await assert.rejects(
      async () => {
        await BookingService.createBooking({
          Slot_ID: 1,
          Produce_ID: 1,
          Estimated_Weight_Tons: 2.0
        }, farmerUser);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'PAST_DATE_NOT_BOOKABLE');
        return true;
      }
    );
  });

  await t.test('8. APMC Admin can book on behalf of any farmer by providing Farmer_ID', async () => {
    const slot = await SlotRepository.findById(29);
    assert.ok(slot, 'Slot 29 should exist');

    const bookingResult = await BookingService.createBooking({
      Farmer_ID: 1, // Admin specifies Farmer 1
      Slot_ID: 29,
      Produce_ID: 2,
      Estimated_Weight_Tons: 3.5
    }, adminUser);

    assert.strictEqual(bookingResult.farmerId, 1);
    assert.strictEqual(bookingResult.bookingStatus, 'Confirmed');

    // Admin cancels
    await BookingService.cancelBooking(bookingResult.bookingId, adminUser);
  });

  await t.test('9. Cancellation authorization: Farmer cannot cancel another farmer\'s booking', async () => {
    // Create a booking for Farmer 31
    const booking = await BookingService.createBooking({
      Slot_ID: 30,
      Produce_ID: 1,
      Estimated_Weight_Tons: 2.0
    }, farmerUser);

    // Other farmer (Farmer 2) attempts to cancel Farmer 31's booking
    await assert.rejects(
      async () => {
        await BookingService.cancelBooking(booking.bookingId, otherFarmerUser);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'FORBIDDEN');
        return true;
      }
    );

    // Legitimate owner cancels successfully
    const cancelRes = await BookingService.cancelBooking(booking.bookingId, farmerUser);
    assert.strictEqual(cancelRes.bookingStatus, 'Cancelled');
    assert.strictEqual(cancelRes.releasedCapacityTons, 2.0);
  });

  await t.test('10. Duplicate cancellation is rejected with 409 ALREADY_CANCELLED and releases capacity only once', async () => {
    const slotBefore = await SlotRepository.findById(31);
    const initialBooked = parseFloat(slotBefore.Booked_Capacity_Tons);

    // Create booking for 5 tons
    const booking = await BookingService.createBooking({
      Slot_ID: 31,
      Produce_ID: 1,
      Estimated_Weight_Tons: 5.0
    }, farmerUser);

    const slotDuring = await SlotRepository.findById(31);
    assert.strictEqual(Math.round((parseFloat(slotDuring.Booked_Capacity_Tons) - initialBooked) * 100) / 100, 5.0);

    // First cancellation: succeeds and releases 5.0 tons
    const cancel1 = await BookingService.cancelBooking(booking.bookingId, farmerUser);
    assert.strictEqual(cancel1.bookingStatus, 'Cancelled');

    const slotAfterCancel1 = await SlotRepository.findById(31);
    assert.strictEqual(Math.round(parseFloat(slotAfterCancel1.Booked_Capacity_Tons) * 100) / 100, Math.round(initialBooked * 100) / 100);

    // Second cancellation: must fail with 409 ALREADY_CANCELLED
    await assert.rejects(
      async () => {
        await BookingService.cancelBooking(booking.bookingId, farmerUser);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 409);
        assert.strictEqual(err.code, 'ALREADY_CANCELLED');
        return true;
      }
    );

    // Capacity must NOT be decremented again
    const slotAfterCancel2 = await SlotRepository.findById(31);
    assert.strictEqual(Math.round(parseFloat(slotAfterCancel2.Booked_Capacity_Tons) * 100) / 100, Math.round(initialBooked * 100) / 100);
  });

  await t.test('11. Cannot cancel a Checked-In or Completed booking', async () => {
    const booking = await BookingService.createBooking({
      Slot_ID: 32,
      Produce_ID: 1,
      Estimated_Weight_Tons: 2.0
    }, farmerUser);

    // Manually simulate check-in
    await db.query("UPDATE Bookings SET Booking_Status = 'Checked-In' WHERE Booking_ID = ?", [booking.bookingId]);

    await assert.rejects(
      async () => {
        await BookingService.cancelBooking(booking.bookingId, farmerUser);
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.strictEqual(err.code, 'CANNOT_CANCEL_CHECKED_IN');
        return true;
      }
    );

    // Cleanup: restore and release capacity
    await db.query("UPDATE Bookings SET Booking_Status = 'Confirmed' WHERE Booking_ID = ?", [booking.bookingId]);
    await BookingService.cancelBooking(booking.bookingId, farmerUser);
  });

  await t.test('12. Concurrent booking requests serialize under row locking and prevent overbooking', async () => {
    // Find an operational slot (e.g. Slot 33)
    const slot = await SlotRepository.findById(33);
    const remaining = parseFloat(slot.Remaining_Capacity_Tons);

    // Suppose we request remaining - 1 ton, so only 1 ton remains
    const primaryWeight = Math.max(1, remaining - 2);
    const booking1 = await BookingService.createBooking({
      Slot_ID: 33,
      Produce_ID: 1,
      Estimated_Weight_Tons: primaryWeight
    }, farmerUser);

    const slotMid = await SlotRepository.findById(33);
    const currentRemaining = parseFloat(slotMid.Remaining_Capacity_Tons);

    // Now launch two concurrent requests, each asking for more than currentRemaining / 2 (e.g. currentRemaining - 0.5)
    // Only one can succeed; the other must receive 409 INSUFFICIENT_CAPACITY
    const contentionWeight = currentRemaining * 0.8;

    const results = await Promise.allSettled([
      BookingService.createBooking({
        Slot_ID: 33,
        Produce_ID: 1,
        Estimated_Weight_Tons: contentionWeight
      }, farmerUser),
      BookingService.createBooking({
        Slot_ID: 33,
        Produce_ID: 1,
        Estimated_Weight_Tons: contentionWeight
      }, farmerUser)
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    assert.strictEqual(fulfilled.length, 1, 'Exactly one concurrent booking should succeed');
    assert.strictEqual(rejected.length, 1, 'Exactly one concurrent booking should fail due to capacity exhaustion');
    assert.strictEqual(rejected[0].reason.statusCode, 409);
    assert.strictEqual(rejected[0].reason.code, 'INSUFFICIENT_CAPACITY');

    // Cleanup all created bookings
    await BookingService.cancelBooking(booking1.bookingId, farmerUser);
    if (fulfilled.length > 0) {
      await BookingService.cancelBooking(fulfilled[0].value.bookingId, farmerUser);
    }
  });

  t.after(async () => {
    await new Promise(r => setTimeout(r, 50));
    await closePool();
  });
});
