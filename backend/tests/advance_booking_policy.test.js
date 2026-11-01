const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const dateUtils = require('../src/utils/dateUtils');
const BookingService = require('../src/services/booking.service');
const SlotRepository = require('../src/repositories/slot.repository');
const FarmerRepository = require('../src/repositories/farmer.repository');
const ProduceRepository = require('../src/repositories/produce.repository');
const UserRepository = require('../src/repositories/user.repository');
const BookingRepository = require('../src/repositories/booking.repository');
const db = require('../src/config/database');
const app = require('../src/app');

// In-memory mock HTTP dispatcher
function dispatch(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = {
      'content-type': 'application/json',
      ...headers
    };
    req.socket = { remoteAddress: '127.0.0.1' };
    req.ip = '127.0.0.1';
    if (body) {
      req.body = body;
    }

    const res = new EventEmitter();
    res.statusCode = 200;
    res._headers = {};
    let responseBody = '';

    res.setHeader = (k, v) => {
      res._headers[k.toLowerCase()] = v;
    };
    res.getHeader = (k) => res._headers[k.toLowerCase()];
    res.hasHeader = (k) => Object.prototype.hasOwnProperty.call(res._headers, k.toLowerCase());
    res.removeHeader = (k) => {
      delete res._headers[k.toLowerCase()];
    };
    res.getHeaders = () => ({ ...res._headers });

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.write = (chunk) => {
      if (chunk) responseBody += chunk.toString();
      return true;
    };
    res.send = (chunk) => {
      if (typeof chunk === 'object' && chunk !== null) {
        responseBody = JSON.stringify(chunk);
      } else if (chunk !== undefined && chunk !== null) {
        responseBody += chunk.toString();
      }
      res.emit('finish');
      try {
        const parsed = JSON.parse(responseBody);
        resolve({ statusCode: res.statusCode, headers: res._headers, body: parsed });
      } catch {
        resolve({ statusCode: res.statusCode, headers: res._headers, body: responseBody });
      }
    };
    res.json = (data) => res.send(data);
    res.end = (chunk) => {
      if (chunk) responseBody += chunk.toString();
      res.emit('finish');
      try {
        const parsed = JSON.parse(responseBody);
        resolve({ statusCode: res.statusCode, headers: res._headers, body: parsed });
      } catch {
        resolve({ statusCode: res.statusCode, headers: res._headers, body: responseBody });
      }
    };

    app.handle(req, res);
  });
}

test('▶ Next-Day Advance Slot Booking Policy Test Suite', async (suite) => {

  await suite.test('1. DateUtils: Calculates today and tomorrow accurately in Asia/Kolkata (IST)', () => {
    const now = new Date();
    const todayIST = dateUtils.getTodayISTDateString(now);
    const tomorrowIST = dateUtils.getTomorrowISTDateString(now);

    assert.match(todayIST, /^\d{4}-\d{2}-\d{2}$/, 'Today format must be YYYY-MM-DD');
    assert.match(tomorrowIST, /^\d{4}-\d{2}-\d{2}$/, 'Tomorrow format must be YYYY-MM-DD');
    assert.ok(tomorrowIST > todayIST, 'Tomorrow must be strictly greater than today');

    // Test specific date
    const testDate = new Date('2026-11-02T12:00:00+05:30');
    assert.strictEqual(dateUtils.getTodayISTDateString(testDate), '2026-11-02');
    assert.strictEqual(dateUtils.getTomorrowISTDateString(testDate), '2026-11-03');
  });

  await suite.test('2. Scenario 1: Farmer attempts to book today\'s date -> REJECTED with SAME_DAY_BOOKING_NOT_PERMITTED', async () => {
    const refDate = new Date('2026-11-02T10:00:00+05:30');
    const todayIST = dateUtils.getTodayISTDateString(refDate);

    // Mock slot on today's date
    const mockSlot = {
      Slot_ID: 10,
      Mandi_ID: 1,
      Slot_Date: todayIST,
      Start_Time: '10:00:00',
      End_Time: '10:20:00',
      Max_Bookings: 5,
      Booked_Count: 0,
      Max_Capacity_Tons: 50.0,
      Booked_Capacity_Tons: 0.0,
      Slot_Status: 'Available'
    };

    // Verify date comparison rejects same-day
    const isSameDay = dateUtils.isSameDayIST(mockSlot.Slot_Date, refDate);
    assert.strictEqual(isSameDay, true, 'Slot date is recognized as same day');

    const isAdvance = dateUtils.isAdvanceBookingDateIST(mockSlot.Slot_Date, refDate);
    assert.strictEqual(isAdvance, false, 'Same day must not be considered an advance booking date');
  });

  await suite.test('3. Scenario 2: Farmer attempts to book yesterday\'s date -> REJECTED with PAST_DATE_NOT_BOOKABLE', async () => {
    const refDate = new Date('2026-11-02T10:00:00+05:30');
    const yesterdayDateStr = '2026-11-01';

    const isPast = dateUtils.isPastDateIST(yesterdayDateStr, refDate);
    assert.strictEqual(isPast, true, 'Yesterday must be detected as past date');

    const isAdvance = dateUtils.isAdvanceBookingDateIST(yesterdayDateStr, refDate);
    assert.strictEqual(isAdvance, false, 'Yesterday cannot be an advance booking');
  });

  await suite.test('4. Scenario 3: Farmer attempts to book tomorrow\'s date -> ACCEPTED as earliest advance date', async () => {
    const refDate = new Date('2026-11-02T10:00:00+05:30');
    const tomorrowIST = dateUtils.getTomorrowISTDateString(refDate); // '2026-11-03'

    const isSameDay = dateUtils.isSameDayIST(tomorrowIST, refDate);
    assert.strictEqual(isSameDay, false, 'Tomorrow is not same day');

    const isPast = dateUtils.isPastDateIST(tomorrowIST, refDate);
    assert.strictEqual(isPast, false, 'Tomorrow is not past date');

    const isAdvance = dateUtils.isAdvanceBookingDateIST(tomorrowIST, refDate);
    assert.strictEqual(isAdvance, true, 'Tomorrow must be accepted as valid advance booking date');
  });

  await suite.test('5. Scenario 4: Farmer attempts to book a future date (+3 days, +7 days) -> ACCEPTED', async () => {
    const refDate = new Date('2026-11-02T10:00:00+05:30');
    const futureDateStr1 = '2026-11-05';
    const futureDateStr2 = '2026-11-10';

    assert.strictEqual(dateUtils.isAdvanceBookingDateIST(futureDateStr1, refDate), true);
    assert.strictEqual(dateUtils.isAdvanceBookingDateIST(futureDateStr2, refDate), true);
  });

  await suite.test('6. Scenario 5 & 6: BookingService.createBooking enforces policy and rolls back on same-day or past date', async () => {
    const fixedNow = new Date('2026-11-02T10:00:00+05:30');

    // Setup mocks
    const origGetConnection = db.getConnection;
    const origFindByIdForUpdate = SlotRepository.findByIdForUpdate;
    const origFindFarmer = FarmerRepository.findById;
    const origFindProduce = ProduceRepository.findById;
    const origFindUser = UserRepository.findById;

    let rollbackCalled = false;
    let committedCalled = false;

    const mockConn = {
      query: async (sql) => {
        if (sql.includes('SELECT Farmer_ID FROM Farmers')) return [[{ Farmer_ID: 1 }]];
        return [{ affectedRows: 1, insertId: 999 }];
      },
      beginTransaction: async () => {},
      commit: async () => { committedCalled = true; },
      rollback: async () => { rollbackCalled = true; },
      release: () => {}
    };

    db.getConnection = async () => mockConn;
    UserRepository.findById = async () => ({ User_ID: 1, User_Role: 'Farmer', Farmer_ID: 1 });
    FarmerRepository.findById = async () => ({ Farmer_ID: 1, Name: 'Test Farmer' });
    ProduceRepository.findById = async () => ({ Produce_ID: 1, Produce_Name: 'Wheat' });

    try {
      // Test A: Same-day booking (Slot date = 2026-11-02)
      SlotRepository.findByIdForUpdate = async () => ({
        Slot_ID: 10,
        Mandi_ID: 1,
        Slot_Date: '2026-11-02',
        Start_Time: '10:00:00',
        End_Time: '10:20:00',
        Max_Bookings: 5,
        Booked_Count: 0,
        Max_Capacity_Tons: 50.0,
        Booked_Capacity_Tons: 0.0,
        Slot_Status: 'Available'
      });

      await assert.rejects(
        () => BookingService.createBooking(
          { Farmer_ID: 1, Slot_ID: 10, Produce_ID: 1, Estimated_Weight_Tons: 5.0 },
          { userId: 1, role: 'Farmer', farmerId: 1 },
          { referenceDate: fixedNow }
        ),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, 'SAME_DAY_BOOKING_NOT_PERMITTED');
          assert.match(err.message, /Same-day booking is not permitted/i);
          return true;
        }
      );
      assert.strictEqual(rollbackCalled, true, 'Transaction must be rolled back on same-day rejection');
      assert.strictEqual(committedCalled, false, 'Transaction must not commit on same-day rejection');

      // Test B: Past-date booking (Slot date = 2026-11-01)
      rollbackCalled = false;
      SlotRepository.findByIdForUpdate = async () => ({
        Slot_ID: 9,
        Mandi_ID: 1,
        Slot_Date: '2026-11-01',
        Start_Time: '10:00:00',
        End_Time: '10:20:00',
        Max_Bookings: 5,
        Booked_Count: 0,
        Max_Capacity_Tons: 50.0,
        Booked_Capacity_Tons: 0.0,
        Slot_Status: 'Available'
      });

      await assert.rejects(
        () => BookingService.createBooking(
          { Farmer_ID: 1, Slot_ID: 9, Produce_ID: 1, Estimated_Weight_Tons: 5.0 },
          { userId: 1, role: 'Farmer', farmerId: 1 },
          { referenceDate: fixedNow }
        ),
        (err) => {
          assert.strictEqual(err.statusCode, 400);
          assert.strictEqual(err.code, 'PAST_DATE_NOT_BOOKABLE');
          return true;
        }
      );
      assert.strictEqual(rollbackCalled, true, 'Transaction must be rolled back on past-date rejection');

    } finally {
      db.getConnection = origGetConnection;
      SlotRepository.findByIdForUpdate = origFindByIdForUpdate;
      FarmerRepository.findById = origFindFarmer;
      ProduceRepository.findById = origFindProduce;
      UserRepository.findById = origFindUser;
    }
  });

  await suite.test('7. Scenario 7: Midnight transition in IST dynamically advances minimum booking eligibility', () => {
    // 1 second before midnight on Nov 2
    const preMidnight = new Date('2026-11-02T23:59:59+05:30');
    assert.strictEqual(dateUtils.getTodayISTDateString(preMidnight), '2026-11-02');
    assert.strictEqual(dateUtils.getTomorrowISTDateString(preMidnight), '2026-11-03');
    // On Nov 2 night, Nov 3 is valid advance date
    assert.strictEqual(dateUtils.isAdvanceBookingDateIST('2026-11-03', preMidnight), true);

    // 1 second after midnight (now Nov 3)
    const postMidnight = new Date('2026-11-03T00:00:01+05:30');
    assert.strictEqual(dateUtils.getTodayISTDateString(postMidnight), '2026-11-03');
    assert.strictEqual(dateUtils.getTomorrowISTDateString(postMidnight), '2026-11-04');
    // Once midnight strikes, Nov 3 is now same-day and rejected!
    assert.strictEqual(dateUtils.isSameDayIST('2026-11-03', postMidnight), true);
    assert.strictEqual(dateUtils.isAdvanceBookingDateIST('2026-11-03', postMidnight), false);
    // Nov 4 is the new earliest eligible advance booking date
    assert.strictEqual(dateUtils.isAdvanceBookingDateIST('2026-11-04', postMidnight), true);
  });

  await suite.test('8. Scenario 8: Browser timezone discrepancy does not compromise IST calendar date calculation', () => {
    // When UTC is still Nov 1 19:30, in IST it is Nov 2 01:00 AM
    const utcTimestamp = new Date('2026-11-01T19:30:00.000Z');
    
    const calculatedToday = dateUtils.getTodayISTDateString(utcTimestamp);
    assert.strictEqual(calculatedToday, '2026-11-02', 'Must resolve to Nov 2 in IST despite UTC being Nov 1');
    
    const calculatedTomorrow = dateUtils.getTomorrowISTDateString(utcTimestamp);
    assert.strictEqual(calculatedTomorrow, '2026-11-03', 'Tomorrow must resolve to Nov 3');
  });

  await suite.test('9. Scenario 9: One-booking-per-farmer-per-day restriction operates seamlessly on advance dates', async () => {
    const reservations = new Map();

    function mockBookAdvance(farmerId, slotDate, bookingId) {
      if (!dateUtils.isAdvanceBookingDateIST(slotDate, new Date('2026-11-02T10:00:00+05:30'))) {
        const err = new Error('Same-day booking is not permitted. Please select tomorrow or a future date.');
        err.code = 'SAME_DAY_BOOKING_NOT_PERMITTED';
        throw err;
      }

      const key = `${farmerId}_${slotDate}`;
      if (reservations.has(key)) {
        const err = new Error(`Farmer ${farmerId} already has a booking on ${slotDate}`);
        err.code = 'ONE_BOOKING_PER_DAY_LIMIT_REACHED';
        throw err;
      }
      reservations.set(key, { bookingId, slotDate, status: 'Confirmed' });
      return { bookingId, status: 'Confirmed' };
    }

    // 1st booking on tomorrow (2026-11-03) -> SUCCESS
    const b1 = mockBookAdvance(1, '2026-11-03', 501);
    assert.strictEqual(b1.status, 'Confirmed');

    // 2nd booking by same farmer on same tomorrow date -> REJECTED
    assert.throws(
      () => mockBookAdvance(1, '2026-11-03', 502),
      (err) => {
        assert.strictEqual(err.code, 'ONE_BOOKING_PER_DAY_LIMIT_REACHED');
        return true;
      }
    );

    // Booking on different advance date (2026-11-04) -> ALLOWED
    const b2 = mockBookAdvance(1, '2026-11-04', 503);
    assert.strictEqual(b2.status, 'Confirmed');
  });

  await suite.test('10. Scenario 10: Concurrency protection on advance booking slots is fully preserved', async () => {
    let slot = {
      Slot_ID: 201,
      Slot_Date: '2026-11-03',
      Max_Bookings: 5,
      Booked_Count: 4,
      Max_Capacity_Tons: 50.0,
      Booked_Capacity_Tons: 40.0,
      Slot_Status: 'Available'
    };

    let lock = Promise.resolve();
    async function concurrentAdvanceBook(farmerId, weight) {
      let release;
      const nextLock = new Promise((res) => { release = res; });
      const prevLock = lock;
      lock = nextLock;
      await prevLock;

      try {
        if (slot.Booked_Count >= slot.Max_Bookings) {
          throw new Error('SLOT_FARMER_LIMIT_REACHED');
        }
        if ((slot.Booked_Capacity_Tons + weight) > slot.Max_Capacity_Tons) {
          throw new Error('INSUFFICIENT_WEIGHT_CAPACITY');
        }
        slot.Booked_Count++;
        slot.Booked_Capacity_Tons += weight;
        if (slot.Booked_Count >= slot.Max_Bookings || slot.Booked_Capacity_Tons >= slot.Max_Capacity_Tons) {
          slot.Slot_Status = 'Full';
        }
        return { bookingId: 900 + farmerId, status: 'Confirmed' };
      } finally {
        release();
      }
    }

    // 2 farmers compete simultaneously for the 5th and final space on tomorrow's slot
    const [res1, res2] = await Promise.allSettled([
      concurrentAdvanceBook(10, 5.0),
      concurrentAdvanceBook(11, 5.0)
    ]);

    const success = [res1, res2].filter(r => r.status === 'fulfilled');
    const rejected = [res1, res2].filter(r => r.status === 'rejected');

    assert.strictEqual(success.length, 1, 'Exactly one advance booking succeeds');
    assert.strictEqual(rejected.length, 1, 'Competing farmer is safely rejected without overselling');
    assert.strictEqual(slot.Booked_Count, 5, 'Slot reaches exactly max 5 bookings');
    assert.strictEqual(slot.Slot_Status, 'Full');
  });
});
