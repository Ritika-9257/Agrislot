const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const env = require('../src/config/env');
const FarmerService = require('../src/services/farmer.service');
const AuthService = require('../src/services/auth.service');
const FarmerRepository = require('../src/repositories/farmer.repository');
const UserRepository = require('../src/repositories/user.repository');
const db = require('../src/config/database');

test('Farmer Auth 1: Farmer registration with password hashes password with bcrypt and creates linked user', async () => {
  const origFindByPhone = FarmerRepository.findByPhone;
  const origFindByAadhaar = FarmerRepository.findByAadhaar;
  const origFarmerCreate = FarmerRepository.create;
  const origFarmerFindById = FarmerRepository.findById;
  const origUserFindByUsername = UserRepository.findByUsername;
  const origUserCreate = UserRepository.create;
  const origGetConnection = db.getConnection;

  let createdFarmerData = null;
  let createdUserData = null;
  let connectionRolledBack = false;
  let connectionCommitted = false;

  const mockConnection = {
    beginTransaction: async () => {},
    commit: async () => { connectionCommitted = true; },
    rollback: async () => { connectionRolledBack = true; },
    release: () => {}
  };

  try {
    db.getConnection = async () => mockConnection;
    FarmerRepository.findByPhone = async () => null;
    FarmerRepository.findByAadhaar = async () => null;
    FarmerRepository.create = async (data) => {
      createdFarmerData = data;
      return 101;
    };
    FarmerRepository.findById = async (id) => ({
      Farmer_ID: id,
      Name: 'Kishore Kumar',
      Phone: '9876543210',
      Aadhar_No: '123456789012',
      UPI_ID: 'kishore@upi',
      Village: 'Bardoli'
    });
    UserRepository.findByUsername = async () => null;
    UserRepository.create = async (userData) => {
      createdUserData = userData;
      return 501;
    };

    const plainPassword = 'safePasscode123';
    const result = await FarmerService.registerFarmer({
      Name: 'Kishore Kumar',
      Phone: '9876543210',
      Aadhar_No: '123456789012',
      UPI_ID: 'kishore@upi',
      Village: 'Bardoli',
      Password: plainPassword
    });

    assert.strictEqual(result.Farmer_ID, 101);
    assert.strictEqual(connectionCommitted, true, 'Transaction must be committed');
    assert.strictEqual(connectionRolledBack, false, 'Transaction must not be rolled back');

    // Verify User record was created with proper linkage
    assert.ok(createdUserData, 'User_Login record should have been created');
    assert.strictEqual(createdUserData.username, '9876543210');
    assert.strictEqual(createdUserData.farmerId, 101, 'Farmer_ID must be linked to User record');
    assert.strictEqual(createdUserData.role, 'Farmer');

    // Verify Password was hashed with bcrypt (never stored as plain text)
    assert.notStrictEqual(createdUserData.passwordHash, plainPassword);
    const isBcryptMatch = await bcrypt.compare(plainPassword, createdUserData.passwordHash);
    assert.strictEqual(isBcryptMatch, true, 'Password must be valid bcrypt hash');
  } finally {
    FarmerRepository.findByPhone = origFindByPhone;
    FarmerRepository.findByAadhaar = origFindByAadhaar;
    FarmerRepository.create = origFarmerCreate;
    FarmerRepository.findById = origFarmerFindById;
    UserRepository.findByUsername = origUserFindByUsername;
    UserRepository.create = origUserCreate;
    db.getConnection = origGetConnection;
  }
});

test('Farmer Auth 2: Registration transaction rollback if User_Login creation fails', async () => {
  const origFindByPhone = FarmerRepository.findByPhone;
  const origFindByAadhaar = FarmerRepository.findByAadhaar;
  const origFarmerCreate = FarmerRepository.create;
  const origUserFindByUsername = UserRepository.findByUsername;
  const origUserCreate = UserRepository.create;
  const origGetConnection = db.getConnection;

  let connectionRolledBack = false;
  let connectionCommitted = false;

  const mockConnection = {
    beginTransaction: async () => {},
    commit: async () => { connectionCommitted = true; },
    rollback: async () => { connectionRolledBack = true; },
    release: () => {}
  };

  try {
    db.getConnection = async () => mockConnection;
    FarmerRepository.findByPhone = async () => null;
    FarmerRepository.findByAadhaar = async () => null;
    FarmerRepository.create = async () => 102;
    UserRepository.findByUsername = async () => null;
    UserRepository.create = async () => {
      throw new Error('Simulated User_Login DB Constraint Failure');
    };

    await assert.rejects(
      async () => {
        await FarmerService.registerFarmer({
          Name: 'Rollback Tester',
          Phone: '9876543211',
          Aadhar_No: '123456789013',
          Password: 'securePassword123'
        });
      },
      /Simulated User_Login DB Constraint Failure/
    );

    assert.strictEqual(connectionRolledBack, true, 'Transaction must be rolled back on failure');
    assert.strictEqual(connectionCommitted, false, 'Transaction must not be committed');
  } finally {
    FarmerRepository.findByPhone = origFindByPhone;
    FarmerRepository.findByAadhaar = origFindByAadhaar;
    FarmerRepository.create = origFarmerCreate;
    UserRepository.findByUsername = origUserFindByUsername;
    UserRepository.create = origUserCreate;
    db.getConnection = origGetConnection;
  }
});

test('Farmer Auth 3: Farmer registration without password preserves APMC/admin creation workflow', async () => {
  const origFindByPhone = FarmerRepository.findByPhone;
  const origFindByAadhaar = FarmerRepository.findByAadhaar;
  const origFarmerCreate = FarmerRepository.create;
  const origFarmerFindById = FarmerRepository.findById;
  const origUserCreate = UserRepository.create;
  const origGetConnection = db.getConnection;

  let userCreateCalled = false;

  const mockConnection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {}
  };

  try {
    db.getConnection = async () => mockConnection;
    FarmerRepository.findByPhone = async () => null;
    FarmerRepository.findByAadhaar = async () => null;
    FarmerRepository.create = async () => 103;
    FarmerRepository.findById = async (id) => ({
      Farmer_ID: id,
      Name: 'APMC Internal Producer',
      Phone: '9876543212',
      Aadhar_No: '123456789014'
    });
    UserRepository.create = async () => {
      userCreateCalled = true;
    };

    const result = await FarmerService.registerFarmer({
      Name: 'APMC Internal Producer',
      Phone: '9876543212',
      Aadhar_No: '123456789014'
      // No Password provided (officer workflow)
    });

    assert.strictEqual(result.Farmer_ID, 103);
    assert.strictEqual(userCreateCalled, false, 'User_Login should not be created when password omitted');
  } finally {
    FarmerRepository.findByPhone = origFindByPhone;
    FarmerRepository.findByAadhaar = origFindByAadhaar;
    FarmerRepository.create = origFarmerCreate;
    FarmerRepository.findById = origFarmerFindById;
    UserRepository.create = origUserCreate;
    db.getConnection = origGetConnection;
  }
});

test('Farmer Auth 4: Farmer login by 10-digit mobile number verifies bcrypt hash and includes Farmer_ID in JWT', async () => {
  const origFindByUsernameOrIdentifier = UserRepository.findByUsernameOrIdentifier;
  const origUpdateLastLogin = UserRepository.updateLastLogin;

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('farmerSecretPass', salt);

  try {
    UserRepository.findByUsernameOrIdentifier = async (identifier) => {
      if (identifier === '9876543210') {
        return {
          User_ID: 88,
          Username: '9876543210',
          Password_Hash: passwordHash,
          User_Role: 'Farmer',
          Account_Status: 'Active',
          Full_Name: 'Kishore Kumar',
          Farmer_ID: 101
        };
      }
      return null;
    };
    UserRepository.updateLastLogin = async () => {};

    const loginRes = await AuthService.login('9876543210', 'farmerSecretPass');

    assert.ok(loginRes.token, 'Token must be issued');
    assert.strictEqual(loginRes.user.farmerId, 101, 'farmerId must be returned in user context');
    assert.strictEqual(loginRes.user.role, 'Farmer');
    assert.strictEqual(loginRes.user.name, 'Kishore Kumar');

    // Decode and verify JWT payload
    const decoded = jwt.verify(loginRes.token, env.JWT_SECRET);
    assert.strictEqual(decoded.userId, 88);
    assert.strictEqual(decoded.farmerId, 101, 'Farmer_ID must be propagated into JWT claims');
    assert.strictEqual(decoded.role, 'Farmer');
  } finally {
    UserRepository.findByUsernameOrIdentifier = origFindByUsernameOrIdentifier;
    UserRepository.updateLastLogin = origUpdateLastLogin;
  }
});

test('Farmer Auth 5: Login with wrong password is rejected with 401 INVALID_CREDENTIALS', async () => {
  const origFindByUsernameOrIdentifier = UserRepository.findByUsernameOrIdentifier;

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('correctPassword', salt);

  try {
    UserRepository.findByUsernameOrIdentifier = async () => ({
      User_ID: 89,
      Username: '9876543215',
      Password_Hash: passwordHash,
      User_Role: 'Farmer',
      Account_Status: 'Active'
    });

    await assert.rejects(
      async () => AuthService.login('9876543215', 'wrongPassword'),
      (err) => {
        assert.strictEqual(err.statusCode, 401);
        assert.strictEqual(err.code, 'INVALID_CREDENTIALS');
        return true;
      }
    );
  } finally {
    UserRepository.findByUsernameOrIdentifier = origFindByUsernameOrIdentifier;
  }
});

test('Farmer Auth 6: Identity-verified password setup for existing farmers (without default passwords)', async () => {
  const origFindByPhone = FarmerRepository.findByPhone;
  const origFindByFarmerId = UserRepository.findByFarmerId;
  const origFindByUsername = UserRepository.findByUsername;
  const origCreate = UserRepository.create;
  const origUpdatePassword = UserRepository.updatePassword;

  let createdUser = null;

  try {
    FarmerRepository.findByPhone = async (phone) => {
      if (phone === '9898001122') {
        return {
          Farmer_ID: 26,
          Name: 'VIKRAM SINGHANIA',
          Phone: '9898001122',
          Aadhar_No: '989898989898'
        };
      }
      return null;
    };
    UserRepository.findByFarmerId = async () => null;
    UserRepository.findByUsername = async () => null;
    UserRepository.create = async (user) => {
      createdUser = user;
      return 92;
    };

    // Test Aadhaar mismatch prevention
    await assert.rejects(
      async () => {
        await AuthService.setupPassword({
          phone: '9898001122',
          aadhaarNo: '000000000000', // Wrong Aadhaar
          password: 'newVikramPassword'
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.code, 'VERIFICATION_FAILED');
        return true;
      }
    );

    // Test successful password setup with verified Aadhaar
    const successRes = await AuthService.setupPassword({
      phone: '9898001122',
      aadhaarNo: '989898989898',
      password: 'newVikramPassword'
    });

    assert.ok(successRes.message);
    assert.ok(createdUser, 'User account should be created');
    assert.strictEqual(createdUser.username, '9898001122');
    assert.strictEqual(createdUser.farmerId, 26);
    assert.strictEqual(createdUser.role, 'Farmer');

    // Verify bcrypt hash
    const isValidHash = await bcrypt.compare('newVikramPassword', createdUser.passwordHash);
    assert.strictEqual(isValidHash, true);
  } finally {
    FarmerRepository.findByPhone = origFindByPhone;
    FarmerRepository.findByFarmerId = origFindByFarmerId;
    UserRepository.findByUsername = origFindByUsername;
    UserRepository.create = origCreate;
    UserRepository.updatePassword = origUpdatePassword;
  }
});

test.after(async () => {
  const { closePool } = require('../src/config/database');
  await closePool();
});
