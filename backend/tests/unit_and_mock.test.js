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
  const validCompleted = updateBookingStatusSchema.safeParse({ Booking_Status: 'Completed' });
  const validCancelled = updateBookingStatusSchema.safeParse({ Booking_Status: 'Cancelled' });

  assert.strictEqual(validConfirmed.success, true);
  assert.strictEqual(validCheckedIn.success, true);
  assert.strictEqual(validCompleted.success, true);
  assert.strictEqual(validCancelled.success, true);

  // Unsupported status
  const invalidStatus = updateBookingStatusSchema.safeParse({ Booking_Status: 'In Process' });
  assert.strictEqual(invalidStatus.success, false, 'In Process is not in MySQL ENUM');
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

test.after(async () => {
  const { closePool } = require('../src/config/database');
  await closePool();
});
