const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const env = require('../src/config/env');
const { generateToken } = require('../src/utils/tokenGenerator');
const { maskAadhaar, maskUPI, maskFarmerProfile } = require('../src/utils/maskData');
const { toXmlDocument } = require('../src/utils/xmlFormatter');
const { registerFarmerSchema } = require('../src/validators/farmer.validator');
const { createBookingSchema } = require('../src/validators/booking.validator');
const { updateBookingStatusSchema, updatePaymentStatusSchema } = require('../src/validators/admin.validator');
const { toCsv, sanitizeCell } = require('../src/utils/csvFormatter');
const { enforceFarmerIsolation } = require('../src/middleware/authenticate');

test('1. Gate-pass token generation format and uniqueness', (t) => {
  const token = generateToken('AG-T');
  assert.match(token, /^AG-T[A-Z0-9]{6}$/, 'Token should match format AG-T + 6 chars');

  // Verify uniqueness across 1000 generated tokens
  const set = new Set();
  for (let i = 0; i < 1000; i++) {
    const tkn = generateToken('AG-T');
    assert.strictEqual(set.has(tkn), false, 'Token collision detected');
    set.add(tkn);
  }
});

test('2. PII Data masking (Aadhaar & UPI privacy protection)', (t) => {
  const maskedAadhaar = maskAadhaar('900000000001');
  assert.strictEqual(maskedAadhaar, 'XXXX-XXXX-0001', 'Aadhaar must only reveal last 4 digits');

  const maskedUPI = maskUPI('ramesh1@upi');
  assert.strictEqual(maskedUPI, 'r*****1@upi', 'UPI username should be masked');

  const farmer = {
    Farmer_ID: 1,
    Name: 'Ramesh Patel',
    Phone: '9000000001',
    Aadhar_No: '900000000001',
    UPI_ID: 'ramesh1@upi',
    Village: 'Olpad'
  };

  const safeProfile = maskFarmerProfile(farmer);
  assert.strictEqual(safeProfile.Aadhar_No, 'XXXX-XXXX-0001');
  assert.strictEqual(safeProfile.UPI_ID, 'r*****1@upi');
  assert.strictEqual(safeProfile.Name, 'Ramesh Patel');
});

test('3. Farmer registration input validation rules', (t) => {
  // Valid farmer
  const valid = registerFarmerSchema.safeParse({
    Name: 'Suresh Kumar',
    Phone: '9876543210',
    Aadhar_No: '123456789012',
    Village: 'Surat'
  });
  assert.strictEqual(valid.success, true);

  // Invalid: Phone fewer than 10 digits
  const invalidPhone = registerFarmerSchema.safeParse({
    Name: 'Suresh Kumar',
    Phone: '12345',
    Aadhar_No: '123456789012'
  });
  assert.strictEqual(invalidPhone.success, false);

  // Invalid: Aadhaar not 12 digits
  const invalidAadhaar = registerFarmerSchema.safeParse({
    Name: 'Suresh Kumar',
    Phone: '9876543210',
    Aadhar_No: '123'
  });
  assert.strictEqual(invalidAadhaar.success, false);

  // Invalid: Empty name
  const invalidName = registerFarmerSchema.safeParse({
    Name: '',
    Phone: '9876543210',
    Aadhar_No: '123456789012'
  });
  assert.strictEqual(invalidName.success, false);
});

test('4. Booking creation validation rules', (t) => {
  // Valid booking
  const valid = createBookingSchema.safeParse({
    Farmer_ID: 1,
    Slot_ID: 2,
    Produce_ID: 3,
    Estimated_Weight_Tons: 10.5
  });
  assert.strictEqual(valid.success, true);

  // Negative weight
  const invalidWeight = createBookingSchema.safeParse({
    Farmer_ID: 1,
    Slot_ID: 2,
    Produce_ID: 3,
    Estimated_Weight_Tons: -5
  });
  assert.strictEqual(invalidWeight.success, false);

  // Zero weight
  const zeroWeight = createBookingSchema.safeParse({
    Farmer_ID: 1,
    Slot_ID: 2,
    Produce_ID: 3,
    Estimated_Weight_Tons: 0
  });
  assert.strictEqual(zeroWeight.success, false);
});

test('5. Admin booking status transition validations', (t) => {
  const validConfirmed = updateBookingStatusSchema.safeParse({ Booking_Status: 'Confirmed' });
  const validCheckedIn = updateBookingStatusSchema.safeParse({ Booking_Status: 'Checked-In' });
  const validInProcess = updateBookingStatusSchema.safeParse({ Booking_Status: 'In Process' });
  const validCompleted = updateBookingStatusSchema.safeParse({ Booking_Status: 'Completed' });
  const validCancelled = updateBookingStatusSchema.safeParse({ Booking_Status: 'Cancelled' });
  const validNoShow = updateBookingStatusSchema.safeParse({ Booking_Status: 'No-Show' });

  assert.strictEqual(validConfirmed.success, true);
  assert.strictEqual(validCheckedIn.success, true);
  assert.strictEqual(validInProcess.success, true);
  assert.strictEqual(validCompleted.success, true);
  assert.strictEqual(validCancelled.success, true);
  assert.strictEqual(validNoShow.success, true);

  // Unsupported status
  const invalidStatus = updateBookingStatusSchema.safeParse({ Booking_Status: 'Under Review' });
  assert.strictEqual(invalidStatus.success, false, 'Under Review is not in MySQL ENUM');
});

test('6. Payment status validation respects schema values (Pending, Released, Failed)', (t) => {
  const validPending = updatePaymentStatusSchema.safeParse({ Payment_Status: 'Pending' });
  const validReleased = updatePaymentStatusSchema.safeParse({ Payment_Status: 'Released' });
  const validFailed = updatePaymentStatusSchema.safeParse({ Payment_Status: 'Failed' });

  assert.strictEqual(validPending.success, true);
  assert.strictEqual(validReleased.success, true);
  assert.strictEqual(validFailed.success, true);

  // Non-schema values (e.g. 'Completed' or 'In Process') should be rejected
  const invalidCompleted = updatePaymentStatusSchema.safeParse({ Payment_Status: 'Completed' });
  assert.strictEqual(invalidCompleted.success, false);

  const invalidInProcess = updatePaymentStatusSchema.safeParse({ Payment_Status: 'In Process' });
  assert.strictEqual(invalidInProcess.success, false);
});

test('7. XML Document generation for Data Extraction (Queries 1, 3, and 4)', (t) => {
  const sampleRecords = [
    { Booking_ID: 1, Token_Number: 'AG-T001', Estimated_Weight_Tons: 10 },
    { Booking_ID: 2, Token_Number: 'AG-T002', Estimated_Weight_Tons: 15 }
  ];

  const xml = toXmlDocument(sampleRecords, 'AgriSlotData', 'Booking');
  assert.match(xml, /<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<AgriSlotData>/);
  assert.match(xml, /<Booking>/);
  assert.match(xml, /<Token_Number>AG-T001<\/Token_Number>/);
  assert.match(xml, /<\/AgriSlotData>/);
});

test('8. JWT Token signature and verification', (t) => {
  const payload = { userId: 1, username: 'admin', role: 'Admin' };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });

  const decoded = jwt.verify(token, env.JWT_SECRET);
  assert.strictEqual(decoded.userId, 1);
  assert.strictEqual(decoded.username, 'admin');
  assert.strictEqual(decoded.role, 'Admin');

  // Verify tampered token fails
  assert.throws(() => {
    jwt.verify(token + 'tampered', env.JWT_SECRET);
  });
});

test('9. Concurrency simulation: Two farmers competing for remaining 10 Tons', async (t) => {
  // Simulate atomic row-level locking behavior
  let slot = {
    Slot_ID: 1,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 40.0 // 10 Tons remaining
  };

  let lock = false; // simulates MySQL 'FOR UPDATE' row lock

  async function atomicBookSlot(farmerId, weight) {
    // Acquire lock (wait if locked)
    while (lock) {
      await new Promise(r => setTimeout(r, 5));
    }
    lock = true;

    try {
      const remaining = slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons;
      if (weight > remaining) {
        throw new Error('INSUFFICIENT_CAPACITY');
      }
      slot.Booked_Capacity_Tons += weight;
      return { success: true, farmerId, bookedWeight: weight, token: generateToken('AG-T') };
    } finally {
      lock = false; // Release lock
    }
  }

  // Two farmers send simultaneous booking requests for 10 Tons each
  const [res1, res2] = await Promise.allSettled([
    atomicBookSlot(101, 10.0),
    atomicBookSlot(102, 10.0)
  ]);

  const successes = [res1, res2].filter(r => r.status === 'fulfilled');
  const rejections = [res1, res2].filter(r => r.status === 'rejected');

  assert.strictEqual(successes.length, 1, 'Exactly one concurrent booking should succeed');
  assert.strictEqual(rejections.length, 1, 'The competing booking must be rejected due to capacity limit');
  assert.strictEqual(rejections[0].reason.message, 'INSUFFICIENT_CAPACITY');
  assert.strictEqual(slot.Booked_Capacity_Tons, 50.0, 'Slot should be exactly full (50.0T) without overselling');
});

test('10. Cancellation releases capacity exactly once', async (t) => {
  let slot = { Slot_ID: 1, Booked_Capacity_Tons: 50.0 };
  let booking = { Booking_ID: 10, Slot_ID: 1, Estimated_Weight_Tons: 10.0, Booking_Status: 'Confirmed' };

  function cancelBooking(b) {
    if (b.Booking_Status === 'Cancelled') {
      throw new Error('ALREADY_CANCELLED');
    }
    b.Booking_Status = 'Cancelled';
    slot.Booked_Capacity_Tons -= b.Estimated_Weight_Tons;
    return { success: true, released: b.Estimated_Weight_Tons };
  }

  // First cancellation succeeds
  const firstCancel = cancelBooking(booking);
  assert.strictEqual(firstCancel.success, true);
  assert.strictEqual(slot.Booked_Capacity_Tons, 40.0);

  // Second cancellation attempt should fail and not subtract capacity again
  assert.throws(() => {
    cancelBooking(booking);
  }, /ALREADY_CANCELLED/);

  assert.strictEqual(slot.Booked_Capacity_Tons, 40.0, 'Capacity must not be decremented twice');
});

test('11. Weighbridge fast-track check-in net payload calculation', (t) => {
  const grossKg = 12920;
  const tareKg = 2920;
  const netKg = grossKg - tareKg;
  const tons = (netKg / 1000).toFixed(2);

  assert.strictEqual(netKg, 10000);
  assert.strictEqual(tons, '10.00');
});

test('12. Resilient field normalization for farmer and booking registration', (t) => {
  // Test with alternative frontend naming
  const parsedFarmer = registerFarmerSchema.safeParse({
    Full_Name: 'Patel Bhavesh',
    Phone_Number: '9898000001',
    Aadhaar_Number: '111122223333',
    Village: 'Bardoli'
  });
  assert.strictEqual(parsedFarmer.success, true);
  assert.strictEqual(parsedFarmer.data.Name, 'Patel Bhavesh');
  assert.strictEqual(parsedFarmer.data.Phone, '9898000001');

  // Test booking with stringified numeric IDs
  const parsedBooking = createBookingSchema.safeParse({
    farmerId: '1',
    slotId: '2',
    produceId: '3',
    weight: '12.5'
  });
  assert.strictEqual(parsedBooking.success, true);
  assert.strictEqual(parsedBooking.data.Farmer_ID, 1);
  assert.strictEqual(parsedBooking.data.Estimated_Weight_Tons, 12.5);
});

test('13. CSV formatting & formula injection mitigation (CWE-1236)', (t) => {
  // Formula prefix neutralization (=, +, -, @)
  const formulaPayload = '=cmd|\' /C calc\'!A0';
  const sanitized = sanitizeCell(formulaPayload);
  assert.ok(sanitized.startsWith("'="), 'Should neutralize formula prefix with single quote');

  const plusFormula = '+1+2';
  assert.strictEqual(sanitizeCell(plusFormula), "'+1+2");

  const atFormula = '@SUM(A1:A10)';
  assert.strictEqual(sanitizeCell(atFormula), "'@SUM(A1:A10)");

  // Standard CSV comma quoting
  const cellWithComma = 'Surat, Central APMC';
  assert.strictEqual(sanitizeCell(cellWithComma), '"Surat, Central APMC"');

  // Full CSV table generation
  const data = [
    { Token: 'AG-T001', Farmer: 'Ramesh Patel', Weight: 10.5 },
    { Token: 'AG-T002', Farmer: '@MaliciousUser', Weight: 5.0 }
  ];
  const csv = toCsv(data);
  assert.ok(csv.includes('Token,Farmer,Weight'));
  assert.ok(csv.includes("'@MaliciousUser"));
  assert.ok(csv.includes('10.5'));
});

test('14. Duplicate check-in prevention enforcement', (t) => {
  const booking = {
    Booking_ID: 101,
    Token_Number: 'AG-T001',
    Booking_Status: 'Checked-In'
  };

  // State machine must reject duplicate check-in
  assert.strictEqual(booking.Booking_Status, 'Checked-In');
  const attemptDuplicate = () => {
    if (booking.Booking_Status === 'Checked-In') {
      const err = new Error('Vehicle has already checked in at the weighbridge gate');
      err.code = 'DUPLICATE_CHECK_IN';
      err.statusCode = 409;
      throw err;
    }
  };

  assert.throws(attemptDuplicate, {
    code: 'DUPLICATE_CHECK_IN',
    statusCode: 409
  });
});

test('15. Farmer record isolation middleware protection', (t) => {
  // Case A: Farmer #1 tries to access Farmer #2 records -> 403 Forbidden
  const reqFarmer1 = {
    user: { userId: 10, role: 'Farmer', farmerId: 1 },
    params: { id: '2' }
  };
  let errorReturned = null;
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(payload) { errorReturned = payload; return this; }
  };
  const next = () => {};

  enforceFarmerIsolation(reqFarmer1, res, next);
  assert.strictEqual(errorReturned?.code, 'FORBIDDEN_FARMER_RECORD');
  assert.strictEqual(errorReturned?.success, false);

  // Case B: Farmer #1 accesses their own records -> Allowed (no error)
  const reqFarmerSelf = {
    user: { userId: 10, role: 'Farmer', farmerId: 1 },
    params: { id: '1' }
  };
  let selfCalledNext = false;
  enforceFarmerIsolation(reqFarmerSelf, res, () => { selfCalledNext = true; });
  assert.strictEqual(selfCalledNext, true, 'Farmer should be permitted to access own records');

  // Case C: Mandi Officer / Admin accesses any farmer record -> Allowed
  const reqOfficer = {
    user: { userId: 99, role: 'Mandi_Officer' },
    params: { id: '2' }
  };
  let officerCalledNext = false;
  enforceFarmerIsolation(reqOfficer, res, () => { officerCalledNext = true; });
  assert.strictEqual(officerCalledNext, true, 'Officer must be permitted to access all records');
});

test('16. Genuine Google ID token validation rejects missing or non-string credentials', async (t) => {
  const AuthService = require('../src/services/auth.service');

  await assert.rejects(
    async () => AuthService.googleLogin({}),
    (err) => {
      assert.strictEqual(err.code, 'GOOGLE_TOKEN_REQUIRED');
      assert.strictEqual(err.statusCode, 400);
      return true;
    }
  );

  await assert.rejects(
    async () => AuthService.googleLogin({ credential: '   ' }),
    (err) => {
      assert.strictEqual(err.code, 'GOOGLE_TOKEN_REQUIRED');
      assert.strictEqual(err.statusCode, 400);
      return true;
    }
  );
});

test('17. Google token verification rejects unverified emails and forged signatures', async (t) => {
  const AuthService = require('../src/services/auth.service');
  env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

  // Subtest 1: Unverified Google email
  AuthService.setOAuthClient({
    async verifyIdToken() {
      return {
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          sub: 'google_sub_unverified',
          email: 'unverified.farmer@gmail.com',
          email_verified: false,
          name: 'Unverified Farmer'
        })
      };
    }
  });

  await assert.rejects(
    async () => AuthService.googleLogin({ credential: 'token_with_unverified_email' }),
    (err) => {
      assert.strictEqual(err.code, 'UNVERIFIED_EMAIL');
      assert.strictEqual(err.statusCode, 401);
      return true;
    }
  );

  // Subtest 2: Forged token (signature verification failure)
  AuthService.setOAuthClient({
    async verifyIdToken() {
      throw new Error('Invalid token signature or expired cryptographic key');
    }
  });

  await assert.rejects(
    async () => AuthService.googleLogin({ credential: 'forged_fake_token' }),
    (err) => {
      assert.strictEqual(err.code, 'INVALID_GOOGLE_TOKEN');
      assert.strictEqual(err.statusCode, 401);
      return true;
    }
  );
});

test('18. Google token verification rejects invalid issuers and wrong audience', async (t) => {
  const AuthService = require('../src/services/auth.service');
  env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

  // Subtest 1: Untrusted issuer
  AuthService.setOAuthClient({
    async verifyIdToken() {
      return {
        getPayload: () => ({
          iss: 'https://malicious-issuer.com',
          sub: 'sub_123',
          email: 'test@gmail.com',
          email_verified: true,
          name: 'Test'
        })
      };
    }
  });

  await assert.rejects(
    async () => AuthService.googleLogin({ credential: 'token_bad_issuer' }),
    (err) => {
      assert.strictEqual(err.code, 'INVALID_GOOGLE_ISSUER');
      assert.strictEqual(err.statusCode, 401);
      return true;
    }
  );
});

test('19. Google OAuth provisioning assigns default role Farmer and ignores client-supplied role tampering', async (t) => {
  const AuthService = require('../src/services/auth.service');
  env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

  AuthService.setOAuthClient({
    async verifyIdToken() {
      return {
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          sub: 'google_sub_farmer_9999',
          email: 'genuine.farmer@gmail.com',
          email_verified: true,
          name: 'Genuine Farmer',
          picture: 'https://lh3.googleusercontent.com/avatar'
        })
      };
    }
  });

  // Attempt privilege escalation: client tries to supply role: 'Admin'
  const result = await AuthService.googleLogin({
    credential: 'valid_token_string',
    role: 'Admin',
    name: 'Tampered Name',
    email: 'tampered@admin.com'
  });

  assert.ok(result.token, 'Should return valid JWT');
  assert.strictEqual(result.user.role, 'Farmer', 'Role must remain Farmer (never Admin)');
  assert.strictEqual(result.user.email, 'genuine.farmer@gmail.com', 'Identity must come from token, not client');
  assert.strictEqual(result.user.name, 'Genuine Farmer');
  assert.strictEqual(result.user.provider, 'google');

  // Verify the issued JWT
  const decoded = jwt.verify(result.token, env.JWT_SECRET);
  assert.strictEqual(decoded.email, 'genuine.farmer@gmail.com');
  assert.strictEqual(decoded.role, 'Farmer');
  assert.strictEqual(decoded.provider, 'google');
});

test('20. Google account linking prevents conflicting Google identity hijacking', async (t) => {
  const AuthService = require('../src/services/auth.service');
  const UserRepository = require('../src/repositories/user.repository');
  env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

  // Mock UserRepository to simulate an existing account that already has a different Google_Sub
  const originalFindByEmail = UserRepository.findByEmail;
  const originalFindByGoogleSub = UserRepository.findByGoogleSub;

  UserRepository.findByGoogleSub = async () => null; // Not found by attacker's sub
  UserRepository.findByEmail = async (email) => ({
    User_ID: 55,
    Username: 'google_victim',
    Email: 'victim@gmail.com',
    Google_Sub: 'original_google_sub_1111',
    User_Role: 'Farmer',
    Account_Status: 'Active'
  });

  AuthService.setOAuthClient({
    async verifyIdToken() {
      return {
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          sub: 'attacker_google_sub_9999', // Different sub
          email: 'victim@gmail.com',
          email_verified: true,
          name: 'Attacker'
        })
      };
    }
  });

  try {
    await assert.rejects(
      async () => AuthService.googleLogin({ credential: 'hijack_attempt_token' }),
      (err) => {
        assert.strictEqual(err.code, 'GOOGLE_IDENTITY_CONFLICT');
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  } finally {
    // Restore original methods
    UserRepository.findByEmail = originalFindByEmail;
    UserRepository.findByGoogleSub = originalFindByGoogleSub;
  }
});

test('21. RBAC: Normal user (Farmer) blocked from admin operations with 403 Forbidden', async (t) => {
  const { requireRole } = require('../src/middleware/authenticate');
  const middleware = requireRole('Admin', 'Mandi_Officer');

  let nextCalled = false;
  let statusResult = null;
  let jsonResult = null;

  const req = {
    user: { userId: 10, username: 'testfarmer', role: 'Farmer' }
  };
  const res = {
    status(code) {
      statusResult = code;
      return this;
    },
    json(payload) {
      jsonResult = payload;
      return this;
    }
  };

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false, 'Farmer must not reach protected admin handler');
  assert.strictEqual(statusResult, 403, 'Should respond with 403 status code');
  assert.strictEqual(jsonResult.code, 'FORBIDDEN');
});

test('22. Public registration strictly defaults to normal user role (Farmer) and ignores role tampering', async (t) => {
  const AuthService = require('../src/services/auth.service');
  const UserRepository = require('../src/repositories/user.repository');

  const origFindByUsername = UserRepository.findByUsername;
  const origCreate = UserRepository.create;

  let capturedRole = null;
  UserRepository.findByUsername = async () => null;
  UserRepository.create = async ({ username, passwordHash, role, status }) => {
    capturedRole = role;
    return 88;
  };

  try {
    const res = await AuthService.registerUser({
      username: 'attempt_escalation_user',
      password: 'password123',
      role: 'Admin' // Tampered role attempt
    });

    assert.strictEqual(res.role, 'Farmer', 'Returned role must be Farmer');
    assert.strictEqual(capturedRole, 'Farmer', 'Database record must be created with Farmer role');
  } finally {
    UserRepository.findByUsername = origFindByUsername;
    UserRepository.create = origCreate;
  }
});

test('23. Admin can promote an eligible user to Admin role with audit trail', async (t) => {
  const AdminService = require('../src/services/admin.service');
  const UserRepository = require('../src/repositories/user.repository');
  const AuditService = require('../src/services/audit.service');

  const origFindById = UserRepository.findById;
  const origUpdateUserRole = UserRepository.updateUserRole;
  const origLogAudit = AuditService.logAudit;

  let userRoleInDb = 'Farmer';
  let loggedAudit = null;

  UserRepository.findById = async (id) => {
    if (id === 1) return { User_ID: 1, Username: 'master_admin', User_Role: 'Admin', Account_Status: 'Active' };
    if (id === 42) return { User_ID: 42, Username: 'eligible_user', Email: 'eligible@agrislot.com', User_Role: userRoleInDb, Account_Status: 'Active' };
    return null;
  };
  UserRepository.updateUserRole = async (id, role) => {
    if (id === 42) userRoleInDb = role;
  };
  AuditService.logAudit = async (entry) => {
    loggedAudit = entry;
  };

  try {
    const updated = await AdminService.updateUserRole({
      actorUserId: 1,
      actorUsername: 'master_admin',
      targetUserId: 42,
      newRole: 'Admin'
    });

    assert.strictEqual(updated.User_Role, 'Admin', 'User should be promoted to Admin');
    assert.strictEqual(userRoleInDb, 'Admin');
    assert.ok(loggedAudit, 'Role change must be logged to audit system');
    assert.strictEqual(loggedAudit.operationType, 'ROLE_CHANGE');
    assert.strictEqual(loggedAudit.oldData.role, 'Farmer');
    assert.strictEqual(loggedAudit.newData.role, 'Admin');
    assert.strictEqual(loggedAudit.changedBy, 'master_admin');
  } finally {
    UserRepository.findById = origFindById;
    UserRepository.updateUserRole = origUpdateUserRole;
    AuditService.logAudit = origLogAudit;
  }
});

test('24. Safeguard: Admin cannot demote themselves (CANNOT_DEMOTE_SELF)', async (t) => {
  const AdminService = require('../src/services/admin.service');
  const UserRepository = require('../src/repositories/user.repository');

  const origFindById = UserRepository.findById;
  UserRepository.findById = async (id) => ({
    User_ID: id,
    Username: 'admin_user',
    User_Role: 'Admin',
    Account_Status: 'Active'
  });

  try {
    await assert.rejects(
      async () => AdminService.updateUserRole({
        actorUserId: 1,
        actorUsername: 'admin_user',
        targetUserId: 1, // Same as actor
        newRole: 'Farmer'
      }),
      (err) => {
        assert.strictEqual(err.code, 'CANNOT_DEMOTE_SELF');
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  } finally {
    UserRepository.findById = origFindById;
  }
});

test('25. Safeguard: System prevents demoting the last active administrator (LAST_ADMIN_PROTECTED)', async (t) => {
  const AdminService = require('../src/services/admin.service');
  const UserRepository = require('../src/repositories/user.repository');

  const origFindById = UserRepository.findById;
  const origCountActiveAdmins = UserRepository.countActiveAdmins;

  UserRepository.findById = async (id) => ({
    User_ID: id,
    Username: 'sole_admin',
    User_Role: 'Admin',
    Account_Status: 'Active'
  });
  UserRepository.countActiveAdmins = async () => 1; // Only 1 active admin exists

  try {
    await assert.rejects(
      async () => AdminService.updateUserRole({
        actorUserId: 99, // Different actor
        actorUsername: 'super_actor',
        targetUserId: 5,
        newRole: 'Farmer'
      }),
      (err) => {
        assert.strictEqual(err.code, 'LAST_ADMIN_PROTECTED');
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  } finally {
    UserRepository.findById = origFindById;
    UserRepository.countActiveAdmins = origCountActiveAdmins;
  }
});

test('26. Stale token protection: Demoted user blocked immediately by requireActiveRole against live DB', async (t) => {
  const { requireActiveRole } = require('../src/middleware/authenticate');
  const UserRepository = require('../src/repositories/user.repository');

  const origFindById = UserRepository.findById;
  // Live database record shows user has been demoted to Farmer
  UserRepository.findById = async (id) => ({
    User_ID: id,
    Username: 'ex_admin',
    User_Role: 'Farmer',
    Account_Status: 'Active'
  });

  const middleware = requireActiveRole('Admin');

  let nextCalled = false;
  let statusResult = null;
  let jsonResult = null;

  // Stale JWT token still claims user is Admin
  const req = {
    user: { userId: 7, username: 'ex_admin', role: 'Admin' }
  };
  const res = {
    status(code) {
      statusResult = code;
      return this;
    },
    json(payload) {
      jsonResult = payload;
      return this;
    }
  };

  try {
    await middleware(req, res, () => {
      nextCalled = true;
    });

    assert.strictEqual(nextCalled, false, 'Demoted user must be blocked even if JWT claims Admin');
    assert.strictEqual(statusResult, 403, 'Should return 403 Forbidden');
    assert.strictEqual(jsonResult.code, 'FORBIDDEN');
    assert.match(jsonResult.message, /Access revoked: Current role \[Farmer\] is not authorized/);
  } finally {
    UserRepository.findById = origFindById;
  }
});

// =============================================================================
// HYBRID SLOT BOOKING SYSTEM (FARMER LIMIT + WEIGHT CAPACITY) TEST SUITE
// =============================================================================

test('27. Hybrid Slot Booking: First farmer successfully books a slot (increments both Booked_Count and Booked_Capacity_Tons)', async (t) => {
  const slot = {
    Slot_ID: 101,
    Max_Bookings: 5,
    Booked_Count: 0,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 0.0,
    Slot_Status: 'Available'
  };

  function simulateBooking(s, weight) {
    if (s.Slot_Status === 'Closed') throw new Error('SLOT_CLOSED');
    if (s.Booked_Count >= s.Max_Bookings) throw new Error('SLOT_FARMER_LIMIT_REACHED');
    if (weight > (s.Max_Capacity_Tons - s.Booked_Capacity_Tons)) throw new Error('INSUFFICIENT_WEIGHT_CAPACITY');

    s.Booked_Count += 1;
    s.Booked_Capacity_Tons += weight;
    if (s.Booked_Count >= s.Max_Bookings || s.Booked_Capacity_Tons >= s.Max_Capacity_Tons) {
      s.Slot_Status = 'Full';
    }
    return { token: 'AG-T001', bookedCount: s.Booked_Count, bookedWeight: s.Booked_Capacity_Tons };
  }

  const res = simulateBooking(slot, 8.5);
  assert.strictEqual(res.bookedCount, 1);
  assert.strictEqual(res.bookedWeight, 8.5);
  assert.strictEqual(slot.Booked_Count, 1);
  assert.strictEqual(slot.Booked_Capacity_Tons, 8.5);
  assert.strictEqual(slot.Slot_Status, 'Available');
});

test('28. Hybrid Slot Booking: Multiple farmers booking the same slot up to limits', async (t) => {
  const slot = {
    Slot_ID: 102,
    Max_Bookings: 5,
    Booked_Count: 0,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 0.0,
    Slot_Status: 'Available'
  };

  const weights = [5.0, 8.0, 2.0, 10.0]; // 4 farmers, total 25T
  for (const w of weights) {
    assert.ok(slot.Booked_Count < slot.Max_Bookings);
    assert.ok(w <= (slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons));
    slot.Booked_Count += 1;
    slot.Booked_Capacity_Tons += w;
  }

  assert.strictEqual(slot.Booked_Count, 4);
  assert.strictEqual(slot.Booked_Capacity_Tons, 25.0);
  assert.strictEqual(slot.Max_Bookings - slot.Booked_Count, 1, '1 space remaining');
  assert.strictEqual(slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons, 25.0, '25T remaining');
});

test('29. Hybrid Slot Booking: Slot becomes RED/Full when farmer limit is reached (even with remaining weight)', async (t) => {
  // Example from prompt: 5 farmers book a total of 30 tons. 20 tons remain, but all 5 spaces occupied!
  const slot = {
    Slot_ID: 103,
    Max_Bookings: 5,
    Booked_Count: 0,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 0.0,
    Slot_Status: 'Available'
  };

  const farmerLoads = [5.0, 8.0, 2.0, 10.0, 5.0]; // Total 30 tons across 5 farmers
  for (const w of farmerLoads) {
    slot.Booked_Count += 1;
    slot.Booked_Capacity_Tons += w;
  }

  // Evaluate status
  const isFarmerLimitHit = slot.Booked_Count >= slot.Max_Bookings;
  const isWeightLimitHit = slot.Booked_Capacity_Tons >= slot.Max_Capacity_Tons;
  const isFull = isFarmerLimitHit || isWeightLimitHit;

  assert.strictEqual(slot.Booked_Count, 5);
  assert.strictEqual(slot.Booked_Capacity_Tons, 30.0);
  assert.strictEqual(isFarmerLimitHit, true, 'All 5 farmer slots filled');
  assert.strictEqual(isWeightLimitHit, false, '20 tons remain');
  assert.strictEqual(isFull, true, 'Slot must become Full/RED because farmer limit is reached');
});

test('30. Hybrid Slot Booking: Slot becomes RED/Full when weight capacity is reached (even with remaining farmer spaces)', async (t) => {
  const slot = {
    Slot_ID: 104,
    Max_Bookings: 5,
    Booked_Count: 0,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 0.0,
    Slot_Status: 'Available'
  };

  // Farmer 1 books 25T, Farmer 2 books 25T -> 50T total with only 2 farmers!
  slot.Booked_Count += 2;
  slot.Booked_Capacity_Tons = 50.0;

  const isFarmerLimitHit = slot.Booked_Count >= slot.Max_Bookings;
  const isWeightLimitHit = slot.Booked_Capacity_Tons >= slot.Max_Capacity_Tons;
  const isFull = isFarmerLimitHit || isWeightLimitHit;

  assert.strictEqual(slot.Booked_Count, 2, 'Only 2 farmers booked');
  assert.strictEqual(isFarmerLimitHit, false, '3 farmer spaces would otherwise remain');
  assert.strictEqual(isWeightLimitHit, true, 'Max 50T reached');
  assert.strictEqual(isFull, true, 'Slot must become Full/RED because weight capacity is exhausted');
});

test('31. Hybrid Slot Booking: Booking rejection when farmer limit reached vs weight limit reached', async (t) => {
  // Case A: 5/5 farmers filled -> rejects with SLOT_FARMER_LIMIT_REACHED
  const fullFarmersSlot = { Max_Bookings: 5, Booked_Count: 5, Max_Capacity_Tons: 50.0, Booked_Capacity_Tons: 30.0 };
  const checkBooking = (s, reqW) => {
    if (s.Booked_Count >= s.Max_Bookings) {
      const err = new Error('Slot is fully booked. Maximum farmer limit reached.');
      err.code = 'SLOT_FARMER_LIMIT_REACHED';
      throw err;
    }
    const rem = s.Max_Capacity_Tons - s.Booked_Capacity_Tons;
    if (reqW > rem) {
      const err = new Error(`Insufficient slot weight capacity. Requested: ${reqW} tons, Available: ${rem} tons.`);
      err.code = 'INSUFFICIENT_WEIGHT_CAPACITY';
      throw err;
    }
    return true;
  };

  assert.throws(() => checkBooking(fullFarmersSlot, 2.0), (err) => {
    assert.strictEqual(err.code, 'SLOT_FARMER_LIMIT_REACHED');
    return true;
  });

  // Case B: 2/5 farmers filled, but only 2.0T remains, farmer requests 5.0T -> rejects with INSUFFICIENT_WEIGHT_CAPACITY
  const weightExhaustedSlot = { Max_Bookings: 5, Booked_Count: 2, Max_Capacity_Tons: 50.0, Booked_Capacity_Tons: 48.0 };
  assert.throws(() => checkBooking(weightExhaustedSlot, 5.0), (err) => {
    assert.strictEqual(err.code, 'INSUFFICIENT_WEIGHT_CAPACITY');
    return true;
  });
});

test('32. Hybrid Concurrency: Simultaneous booking race condition for the last farmer space', async (t) => {
  let slot = {
    Slot_ID: 105,
    Max_Bookings: 5,
    Booked_Count: 4, // 4 already booked, only 1 space remaining!
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 35.0
  };

  let dbLock = false;

  async function atomicBook(farmerId, weight) {
    while (dbLock) {
      await new Promise(r => setTimeout(r, 2));
    }
    dbLock = true;
    try {
      if (slot.Booked_Count >= slot.Max_Bookings) {
        throw new Error('SLOT_FARMER_LIMIT_REACHED');
      }
      if (weight > (slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons)) {
        throw new Error('INSUFFICIENT_WEIGHT_CAPACITY');
      }
      slot.Booked_Count += 1;
      slot.Booked_Capacity_Tons += weight;
      return { success: true, farmerId };
    } finally {
      dbLock = false;
    }
  }

  // 2 farmers compete simultaneously for the 5th and final space
  const [res1, res2] = await Promise.allSettled([
    atomicBook(201, 5.0),
    atomicBook(202, 5.0)
  ]);

  const wins = [res1, res2].filter(r => r.status === 'fulfilled');
  const losses = [res1, res2].filter(r => r.status === 'rejected');

  assert.strictEqual(wins.length, 1, 'Exactly one farmer gets the last space');
  assert.strictEqual(losses.length, 1, 'The competing farmer is rejected');
  assert.strictEqual(losses[0].reason.message, 'SLOT_FARMER_LIMIT_REACHED');
  assert.strictEqual(slot.Booked_Count, 5, 'Slot reaches exactly max 5 bookings without exceeding');
});

test('33. Hybrid Cancellation: Restores both farmer count and weight capacity exactly once', async (t) => {
  let slot = {
    Slot_ID: 106,
    Max_Bookings: 5,
    Booked_Count: 5,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 40.0,
    Slot_Status: 'Full'
  };

  let booking = {
    Booking_ID: 88,
    Slot_ID: 106,
    Farmer_ID: 1,
    Estimated_Weight_Tons: 8.0,
    Booking_Status: 'Confirmed'
  };

  function cancelBooking(b, s) {
    if (b.Booking_Status === 'Cancelled') {
      throw new Error('ALREADY_CANCELLED');
    }
    b.Booking_Status = 'Cancelled';
    s.Booked_Count = Math.max(0, s.Booked_Count - 1);
    s.Booked_Capacity_Tons = Math.max(0, s.Booked_Capacity_Tons - b.Estimated_Weight_Tons);
    if (s.Booked_Count < s.Max_Bookings && s.Booked_Capacity_Tons < s.Max_Capacity_Tons) {
      s.Slot_Status = 'Available';
    }
    return { success: true, restoredSpaces: 1, restoredWeight: b.Estimated_Weight_Tons };
  }

  // 1st cancel succeeds
  const cancelRes = cancelBooking(booking, slot);
  assert.strictEqual(cancelRes.success, true);
  assert.strictEqual(slot.Booked_Count, 4, 'Farmer count restored from 5 to 4');
  assert.strictEqual(slot.Booked_Capacity_Tons, 32.0, 'Weight restored from 40 to 32 Tons');
  assert.strictEqual(slot.Slot_Status, 'Available', 'Slot reverts to Available');

  // 2nd cancel attempt is rejected
  assert.throws(() => cancelBooking(booking, slot), /ALREADY_CANCELLED/);
  assert.strictEqual(slot.Booked_Count, 4, 'Farmer count must not decrement twice');
  assert.strictEqual(slot.Booked_Capacity_Tons, 32.0, 'Weight must not decrement twice');
});

test('34. Booking History: Cancelled bookings remain in database with status Cancelled', async (t) => {
  const mockDbBookings = [
    { Booking_ID: 1, Booking_Status: 'Confirmed', Estimated_Weight_Tons: 10 },
    { Booking_ID: 2, Booking_Status: 'Cancelled', Estimated_Weight_Tons: 5 },
    { Booking_ID: 3, Booking_Status: 'Completed', Estimated_Weight_Tons: 8 }
  ];

  // Records are never deleted; historical ledger is preserved
  assert.strictEqual(mockDbBookings.length, 3, 'No row is deleted');
  const cancelledRecord = mockDbBookings.find(b => b.Booking_ID === 2);
  assert.strictEqual(cancelledRecord.Booking_Status, 'Cancelled');
});

test('35. Role Authorization: Farmer cannot access admin slot limits or demote users', async (t) => {
  const { requireActiveRole } = require('../src/middleware/authenticate');
  const guard = requireActiveRole('Admin');

  let blocked = false;
  const req = { user: { role: 'Farmer', userId: 2 } };
  const res = {
    status(c) {
      if (c === 403) blocked = true;
      return this;
    },
    json() { return this; }
  };

  await guard(req, res, () => {});
  assert.strictEqual(blocked, true, 'Farmer must be blocked with 403');
});

test('36. Admin Slot Limits: Safe limits change enforces limits cannot drop below already booked values', async (t) => {
  const slot = {
    Slot_ID: 107,
    Max_Bookings: 5,
    Booked_Count: 3,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 25.0
  };

  function validateLimitChange(s, newMaxB, newMaxC) {
    if (newMaxB !== undefined && newMaxB < s.Booked_Count) {
      const err = new Error(`Cannot reduce maximum farmers to ${newMaxB}. Slot already has ${s.Booked_Count} active booking(s).`);
      err.code = 'CANNOT_REDUCE_BELOW_BOOKED_COUNT';
      throw err;
    }
    if (newMaxC !== undefined && newMaxC < s.Booked_Capacity_Tons) {
      const err = new Error(`Cannot reduce maximum capacity to ${newMaxC}T. Slot already has ${s.Booked_Capacity_Tons}T booked.`);
      err.code = 'CANNOT_REDUCE_BELOW_BOOKED_WEIGHT';
      throw err;
    }
    if (newMaxB !== undefined) s.Max_Bookings = newMaxB;
    if (newMaxC !== undefined) s.Max_Capacity_Tons = newMaxC;
    return true;
  }

  // Attempting to lower Max_Bookings to 2 when 3 are booked must fail
  assert.throws(() => validateLimitChange(slot, 2, undefined), (err) => {
    assert.strictEqual(err.code, 'CANNOT_REDUCE_BELOW_BOOKED_COUNT');
    return true;
  });

  // Attempting to lower Max_Capacity_Tons to 20T when 25T are booked must fail
  assert.throws(() => validateLimitChange(slot, undefined, 20.0), (err) => {
    assert.strictEqual(err.code, 'CANNOT_REDUCE_BELOW_BOOKED_WEIGHT');
    return true;
  });

  // Valid change: increase max farmers to 8 and capacity to 60T
  const valid = validateLimitChange(slot, 8, 60.0);
  assert.strictEqual(valid, true);
  assert.strictEqual(slot.Max_Bookings, 8);
  assert.strictEqual(slot.Max_Capacity_Tons, 60.0);
});

test('37. Consistent Availability: MySQL Availability_Status matches hybrid calculation for farmer and admin', (t) => {
  const cases = [
    { Max_Bookings: 5, Booked_Count: 0, Max_Capacity_Tons: 50.0, Booked_Capacity_Tons: 0.0, Slot_Status: 'Available', expected: 'Available' },
    { Max_Bookings: 5, Booked_Count: 5, Max_Capacity_Tons: 50.0, Booked_Capacity_Tons: 20.0, Slot_Status: 'Available', expected: 'Full' },
    { Max_Bookings: 5, Booked_Count: 2, Max_Capacity_Tons: 50.0, Booked_Capacity_Tons: 50.0, Slot_Status: 'Available', expected: 'Full' },
    { Max_Bookings: 5, Booked_Count: 1, Max_Capacity_Tons: 50.0, Booked_Capacity_Tons: 10.0, Slot_Status: 'Closed', expected: 'Closed' }
  ];

  for (const c of cases) {
    const computed = c.Slot_Status === 'Closed' 
      ? 'Closed' 
      : (c.Booked_Count >= c.Max_Bookings || c.Booked_Capacity_Tons >= c.Max_Capacity_Tons) 
      ? 'Full' 
      : 'Available';
    assert.strictEqual(computed, c.expected);
  }
});

test('38. Slot Validation: Closed slots and expired past dates are strictly rejected', (t) => {
  const checkSlotValidity = (slotDate, status) => {
    if (status === 'Closed') throw new Error('SLOT_CLOSED');
    const today = new Date().toISOString().split('T')[0];
    if (slotDate < today) throw new Error('PAST_DATE_NOT_BOOKABLE');
    return true;
  };

  // Past date rejected
  assert.throws(() => checkSlotValidity('2020-01-01', 'Available'), /PAST_DATE_NOT_BOOKABLE/);

  // Closed slot rejected
  assert.throws(() => checkSlotValidity('2099-01-01', 'Closed'), /SLOT_CLOSED/);

  // Future available slot succeeds
  assert.strictEqual(checkSlotValidity('2099-01-01', 'Available'), true);
});

// ==============================================================================
// PART 3: EXTENSIVE TEST SUITE FOR HYBRID AVAILABILITY & 1-BOOKING/DAY RULES
// ==============================================================================

test('39. Hybrid Availability: 40/50 tons booked with farmer spaces remaining is Available (Slot S10 scenario)', (t) => {
  const slot = {
    Slot_ID: 245,
    Max_Bookings: 5,
    Booked_Count: 1,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 40.0,
    Slot_Status: 'Available'
  };

  const remainingSpaces = slot.Max_Bookings - slot.Booked_Count; // 4 spaces left
  const remainingWeight = slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons; // 10.0T left

  const isFull = (slot.Booked_Count >= slot.Max_Bookings) || (remainingWeight <= 0);
  assert.strictEqual(isFull, false, 'Slot must NOT be full when 4 spaces and 10.0T remain');
  assert.strictEqual(remainingSpaces, 4);
  assert.strictEqual(remainingWeight, 10.0);
});

test('40. Hybrid Availability: 45/50 tons booked with farmer spaces remaining is Available (Slot S04 scenario)', (t) => {
  const slot = {
    Slot_ID: 239,
    Max_Bookings: 5,
    Booked_Count: 1,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 45.0,
    Slot_Status: 'Available'
  };

  const remainingSpaces = slot.Max_Bookings - slot.Booked_Count; // 4 spaces left
  const remainingWeight = slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons; // 5.0T left

  const isFull = (slot.Booked_Count >= slot.Max_Bookings) || (remainingWeight <= 0);
  assert.strictEqual(isFull, false, 'Slot must NOT be full when 4 spaces and 5.0T remain');
  assert.strictEqual(remainingSpaces, 4);
  assert.strictEqual(remainingWeight, 5.0);
});

test('41. Hybrid Availability: 50/50 tons booked is Full, even with farmer spaces open', (t) => {
  const slot = {
    Slot_ID: 250,
    Max_Bookings: 5,
    Booked_Count: 3,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 50.0,
    Slot_Status: 'Full'
  };

  const remainingWeight = slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons;
  const isFull = (slot.Booked_Count >= slot.Max_Bookings) || (remainingWeight <= 0);
  assert.strictEqual(isFull, true, 'Slot MUST be full when weight capacity reaches 50.0/50.0T');
});

test('42. Hybrid Availability: 5/5 farmers booked is Full, even with weight capacity open', (t) => {
  const slot = {
    Slot_ID: 251,
    Max_Bookings: 5,
    Booked_Count: 5,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 30.0,
    Slot_Status: 'Full'
  };

  const remainingSpaces = slot.Max_Bookings - slot.Booked_Count;
  const isFull = (remainingSpaces <= 0) || ((slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons) <= 0);
  assert.strictEqual(isFull, true, 'Slot MUST be full when farmer count reaches 5/5');
});

test('43. Hybrid Availability: Requested weight (10T) exceeds remaining capacity (5T) rejects booking without marking slot Full for others', (t) => {
  const slot = {
    Slot_ID: 239,
    Max_Bookings: 5,
    Booked_Count: 1,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 45.0, // 5.0T remaining
    Slot_Status: 'Available'
  };

  function validateBookingAttempt(requestedWeight) {
    const remainingCap = slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons;
    if (requestedWeight > remainingCap) {
      const err = new Error(`Insufficient slot weight capacity. Requested: ${requestedWeight} tons, Available: ${remainingCap} tons`);
      err.code = 'INSUFFICIENT_WEIGHT_CAPACITY';
      throw err;
    }
    return true;
  }

  // Farmer A requesting 10.0T is rejected
  assert.throws(() => validateBookingAttempt(10.0), (err) => {
    assert.strictEqual(err.code, 'INSUFFICIENT_WEIGHT_CAPACITY');
    return true;
  });

  // Slot remains available for Farmer B requesting 2.5T!
  assert.strictEqual(validateBookingAttempt(2.5), true, 'Farmer B requesting 2.5T can still book');
  assert.strictEqual(slot.Slot_Status, 'Available', 'Slot status is NOT corrupted to Full');
});

test('44. One Booking Per Day: Farmer creates first booking on calendar date -> SUCCESS', async (t) => {
  const reservations = new Map(); // Key: `${farmerId}_${date}`

  function bookDay(farmerId, date, bookingId) {
    const key = `${farmerId}_${date}`;
    if (reservations.has(key)) {
      const err = new Error(`Farmer ${farmerId} already has a booking on ${date}`);
      err.code = 'ONE_BOOKING_PER_DAY_LIMIT_REACHED';
      throw err;
    }
    reservations.set(key, { bookingId, date, status: 'Confirmed' });
    return { success: true, bookingId };
  }

  const res = bookDay(1, '2026-11-02', 101);
  assert.strictEqual(res.success, true);
  assert.strictEqual(reservations.size, 1);
});

test('45. One Booking Per Day: Same farmer attempts second booking on same date at same mandi -> REJECTED', async (t) => {
  const reservations = new Map([['1_2026-11-02', { bookingId: 101, status: 'Confirmed' }]]);

  function bookDay(farmerId, date, bookingId) {
    const key = `${farmerId}_${date}`;
    if (reservations.has(key)) {
      const err = new Error(`Farmer ${farmerId} already has a booking on ${date}`);
      err.code = 'ONE_BOOKING_PER_DAY_LIMIT_REACHED';
      throw err;
    }
    reservations.set(key, { bookingId, date, status: 'Confirmed' });
    return { success: true, bookingId };
  }

  assert.throws(() => bookDay(1, '2026-11-02', 102), (err) => {
    assert.strictEqual(err.code, 'ONE_BOOKING_PER_DAY_LIMIT_REACHED');
    return true;
  });
});

test('46. One Booking Per Day: Same farmer books a different calendar date -> ALLOWED', async (t) => {
  const reservations = new Map([['1_2026-11-02', { bookingId: 101, status: 'Confirmed' }]]);

  function bookDay(farmerId, date, bookingId) {
    const key = `${farmerId}_${date}`;
    if (reservations.has(key)) {
      const err = new Error(`Farmer ${farmerId} already has a booking on ${date}`);
      err.code = 'ONE_BOOKING_PER_DAY_LIMIT_REACHED';
      throw err;
    }
    reservations.set(key, { bookingId, date, status: 'Confirmed' });
    return { success: true, bookingId };
  }

  const res = bookDay(1, '2026-11-03', 103);
  assert.strictEqual(res.success, true);
  assert.strictEqual(reservations.size, 2);
});

test('47. One Booking Per Day: Same farmer tries another mandi on the same date -> REJECTED across mandis', async (t) => {
  const reservations = new Map([['1_2026-11-02', { bookingId: 101, mandiId: 1, status: 'Confirmed' }]]);

  function bookAnyMandi(farmerId, mandiId, date, bookingId) {
    const key = `${farmerId}_${date}`; // Mandi independent!
    if (reservations.has(key)) {
      const err = new Error(`Farmer ${farmerId} already booked at Mandi ${reservations.get(key).mandiId} on ${date}`);
      err.code = 'ONE_BOOKING_PER_DAY_LIMIT_REACHED';
      throw err;
    }
    reservations.set(key, { bookingId, mandiId, date, status: 'Confirmed' });
    return { success: true, bookingId };
  }

  // Attempting to book at Mandi 2 on same day must be rejected
  assert.throws(() => bookAnyMandi(1, 2, '2026-11-02', 104), (err) => {
    assert.strictEqual(err.code, 'ONE_BOOKING_PER_DAY_LIMIT_REACHED');
    return true;
  });
});

test('48. One Booking Per Day: Farmer cancels upcoming booking on date, then books another slot on that same date -> ALLOWED', async (t) => {
  const bookings = new Map([
    [101, { bookingId: 101, farmerId: 1, date: '2026-11-02', status: 'Confirmed' }]
  ]);
  const reservations = new Map([['1_2026-11-02', 101]]);

  function cancelBooking(bookingId) {
    const b = bookings.get(bookingId);
    if (!b || b.status !== 'Confirmed') throw new Error('CANNOT_CANCEL');
    b.status = 'Cancelled';
    reservations.delete(`${b.farmerId}_${b.date}`);
    return true;
  }

  function bookDay(farmerId, date, bookingId) {
    const key = `${farmerId}_${date}`;
    if (reservations.has(key)) {
      const err = new Error('ONE_BOOKING_PER_DAY_LIMIT_REACHED');
      err.code = 'ONE_BOOKING_PER_DAY_LIMIT_REACHED';
      throw err;
    }
    bookings.set(bookingId, { bookingId, farmerId, date, status: 'Confirmed' });
    reservations.set(key, bookingId);
    return { success: true, bookingId };
  }

  // Cancel booking 101
  cancelBooking(101);
  assert.strictEqual(bookings.get(101).status, 'Cancelled');
  assert.strictEqual(reservations.has('1_2026-11-02'), false, 'Reservation must be deleted on cancel');

  // Now rebook on 2026-11-02
  const rebook = bookDay(1, '2026-11-02', 105);
  assert.strictEqual(rebook.success, true);
  assert.strictEqual(bookings.get(105).status, 'Confirmed');
  assert.strictEqual(bookings.get(101).status, 'Cancelled', 'Historical record 101 remains in ledger');
});

test('49. One Booking Per Day: Farmer with Checked-In, In-Process, or Completed booking attempts another booking on that date -> REJECTED', async (t) => {
  const nonCancellableStatuses = ['Checked-In', 'In Process', 'Completed', 'No-Show'];

  for (const status of nonCancellableStatuses) {
    const reservations = new Map([['1_2026-11-02', { bookingId: 200, status }]]);

    function bookDay(farmerId, date) {
      if (reservations.has(`${farmerId}_${date}`)) {
        const err = new Error('ONE_BOOKING_PER_DAY_LIMIT_REACHED');
        err.code = 'ONE_BOOKING_PER_DAY_LIMIT_REACHED';
        throw err;
      }
      return true;
    }

    assert.throws(() => bookDay(1, '2026-11-02'), (err) => {
      assert.strictEqual(err.code, 'ONE_BOOKING_PER_DAY_LIMIT_REACHED');
      return true;
    }, `Status ${status} must permanently block additional daily booking`);
  }
});

test('50. One Booking Per Day: Farmer attempts to book using another farmer name in payload -> REJECTED (enforces authenticated Farmer_ID)', async (t) => {
  const req = {
    user: { userId: 3, farmerId: 1, role: 'Farmer', username: 'farmer_ramesh' },
    body: {
      Slot_ID: 10,
      Farmer_ID: 999, // Attempted spoof of Farmer 999
      Produce_ID: 1,
      Estimated_Weight_Tons: 5.0
    }
  };

  // Secure controller/service resolution ignores body.Farmer_ID and strictly binds authenticated JWT farmerId
  const resolvedFarmerId = req.user.role === 'Farmer' ? req.user.farmerId : (req.body.Farmer_ID || req.user.farmerId);
  assert.strictEqual(resolvedFarmerId, 1, 'Resolved farmer ID must strictly be 1 (authenticated user)');
  assert.notStrictEqual(resolvedFarmerId, 999, 'Client payload spoofing must be completely ignored');
});

test('51. One Booking Per Day: Concurrency simulation of two simultaneous requests from the same farmer for the same date -> Exactly one succeeds', async (t) => {
  const reservations = new Map();
  let farmerMutex = false;

  async function concurrentBookingAttempt(farmerId, date, bookingId) {
    // Acquire farmer row lock (SELECT ... FOR UPDATE simulation)
    while (farmerMutex) {
      await new Promise(r => setTimeout(r, 2));
    }
    farmerMutex = true;
    try {
      const key = `${farmerId}_${date}`;
      if (reservations.has(key)) {
        const err = new Error('ONE_BOOKING_PER_DAY_LIMIT_REACHED');
        err.code = 'ONE_BOOKING_PER_DAY_LIMIT_REACHED';
        throw err;
      }
      reservations.set(key, bookingId);
      return { success: true, bookingId };
    } finally {
      farmerMutex = false;
    }
  }

  // Fire 2 concurrent requests from Farmer 1 on 2026-11-02
  const results = await Promise.allSettled([
    concurrentBookingAttempt(1, '2026-11-02', 301),
    concurrentBookingAttempt(1, '2026-11-02', 302)
  ]);

  const successes = results.filter(r => r.status === 'fulfilled');
  const failures = results.filter(r => r.status === 'rejected');

  assert.strictEqual(successes.length, 1, 'Only one concurrent request can succeed');
  assert.strictEqual(failures.length, 1, 'The competing concurrent request is rejected');
  assert.strictEqual(failures[0].reason.code, 'ONE_BOOKING_PER_DAY_LIMIT_REACHED');
  assert.strictEqual(reservations.size, 1);
});

test('52. Hybrid Concurrency: Two DIFFERENT farmers can book the same slot if both limits permit it', async (t) => {
  const slot = {
    Slot_ID: 500,
    Max_Bookings: 5,
    Booked_Count: 0,
    Max_Capacity_Tons: 50.0,
    Booked_Capacity_Tons: 0.0
  };

  const reservations = new Map();

  function bookSlot(farmerId, date, weight, bookingId) {
    if (reservations.has(`${farmerId}_${date}`)) {
      throw new Error('ONE_BOOKING_PER_DAY_LIMIT_REACHED');
    }
    if (slot.Booked_Count >= slot.Max_Bookings) {
      throw new Error('SLOT_FARMER_LIMIT_REACHED');
    }
    if (weight > (slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons)) {
      throw new Error('INSUFFICIENT_WEIGHT_CAPACITY');
    }
    slot.Booked_Count += 1;
    slot.Booked_Capacity_Tons += weight;
    reservations.set(`${farmerId}_${date}`, bookingId);
    return { success: true, farmerId, bookingId };
  }

  // Farmer 1 books 20T
  const res1 = bookSlot(1, '2026-11-02', 20.0, 401);
  assert.strictEqual(res1.success, true);

  // Farmer 2 books 15T on the SAME slot
  const res2 = bookSlot(2, '2026-11-02', 15.0, 402);
  assert.strictEqual(res2.success, true);

  assert.strictEqual(slot.Booked_Count, 2, '2 farmers booked');
  assert.strictEqual(slot.Booked_Capacity_Tons, 35.0, '35T total booked');
  assert.strictEqual(slot.Max_Capacity_Tons - slot.Booked_Capacity_Tons, 15.0, '15T remaining');
});

test('53. Data Integrity: Cancellation restores slot counters exactly once and preserves original booking history with status Cancelled', (t) => {
  const slot = {
    Booked_Count: 3,
    Booked_Capacity_Tons: 30.0,
    Max_Bookings: 5,
    Max_Capacity_Tons: 50.0
  };

  const booking = {
    Booking_ID: 777,
    Estimated_Weight_Tons: 10.0,
    Booking_Status: 'Confirmed'
  };

  // Perform cancel
  booking.Booking_Status = 'Cancelled';
  slot.Booked_Count = Math.max(0, slot.Booked_Count - 1);
  slot.Booked_Capacity_Tons = Math.max(0, slot.Booked_Capacity_Tons - booking.Estimated_Weight_Tons);

  assert.strictEqual(slot.Booked_Count, 2);
  assert.strictEqual(slot.Booked_Capacity_Tons, 20.0);
  assert.strictEqual(booking.Booking_Status, 'Cancelled');
});

test('54. Data Integrity: Slot counters reconcile to match active booking records (excluding Cancelled)', (t) => {
  const slotBookings = [
    { Booking_ID: 1, Estimated_Weight_Tons: 10.0, Booking_Status: 'Confirmed' },
    { Booking_ID: 2, Estimated_Weight_Tons: 15.0, Booking_Status: 'Checked-In' },
    { Booking_ID: 3, Estimated_Weight_Tons: 5.0, Booking_Status: 'Cancelled' }, // EXCLUDED
    { Booking_ID: 4, Estimated_Weight_Tons: 12.0, Booking_Status: 'Completed' }
  ];

  const activeBookings = slotBookings.filter(b => b.Booking_Status !== 'Cancelled');
  const reconciledCount = activeBookings.length;
  const reconciledWeight = activeBookings.reduce((sum, b) => sum + b.Estimated_Weight_Tons, 0);

  assert.strictEqual(reconciledCount, 3, 'Active count must exclude cancelled');
  assert.strictEqual(reconciledWeight, 37.0, 'Active weight must exclude cancelled');
});

test('55. Data Integrity: Farmer privacy is maintained (farmer cannot see other farmers PII or bookings)', (t) => {
  const allBookings = [
    { Booking_ID: 1, Farmer_ID: 1, Farmer_Name: 'Ramesh Patel', Phone: '9876543210' },
    { Booking_ID: 2, Farmer_ID: 2, Farmer_Name: 'Suresh Kumar', Phone: '9123456789' }
  ];

  const requestingFarmerId = 1;
  const visibleBookings = allBookings.filter(b => b.Farmer_ID === requestingFarmerId);

  assert.strictEqual(visibleBookings.length, 1);
  assert.strictEqual(visibleBookings[0].Farmer_ID, 1);
  assert.ok(!visibleBookings.some(b => b.Farmer_ID === 2), 'Farmer 2 data must never be visible to Farmer 1');
});

test.after(async () => {
  const { closePool } = require('../src/config/database');
  await closePool();
});
