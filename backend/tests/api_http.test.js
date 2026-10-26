const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const app = require('../src/app');
const env = require('../src/config/env');
const { closePool } = require('../src/config/database');

// In-memory mock HTTP dispatcher that supports Helmet, Express header methods, and Streams
function dispatch(app, { method = 'GET', url = '/', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
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
      } else {
        responseBody += chunk || '';
      }
      res.emit('finish');
    };
    res.json = (obj) => {
      res.setHeader('content-type', 'application/json');
      responseBody = JSON.stringify(obj);
      res.emit('finish');
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk.toString();
      res.emit('finish');
    };

    res.on('finish', () => {
      let parsed = null;
      try {
        parsed = JSON.parse(responseBody);
      } catch (e) {
        parsed = responseBody;
      }
      resolve({
        statusCode: res.statusCode,
        headers: res._headers,
        body: parsed,
        text: responseBody
      });
    });

    try {
      app.handle(req, res, (err) => {
        if (err) return reject(err);
      });

      if (body) {
        const payload = typeof body === 'object' ? JSON.stringify(body) : body;
        req.emit('data', Buffer.from(payload));
      }
      req.emit('end');
    } catch (err) {
      reject(err);
    }
  });
}

test('HTTP API Route In-Memory Dispatch Suite', async (t) => {
  t.after(async () => {
    await closePool();
  });

  await t.test('1. GET /api/v1/health returns 200 with status UP', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/v1/health' });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.status, 'UP');
  });

  await t.test('2. GET /api returns project documentation metadata', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api' });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.project, 'AgriSlot APMC Slot Booking System');
    assert.strictEqual(res.body.version, '1.0.0');
  });

  await t.test('3. POST /api/v1/farmers rejects invalid phone number (less than 10 digits)', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/farmers',
      body: {
        Name: 'Test Farmer',
        Phone: '12345',
        Aadhar_No: '123456789012'
      }
    });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'VALIDATION_ERROR');
    assert.ok(res.body.errors.some(e => e.field === 'Phone'));
  });

  await t.test('4. POST /api/v1/bookings rejects negative estimated weight', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/bookings',
      body: {
        Farmer_ID: 1,
        Slot_ID: 1,
        Produce_ID: 1,
        Estimated_Weight_Tons: -10
      }
    });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'VALIDATION_ERROR');
  });

  await t.test('5. Protected admin routes return 401 when token is missing', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/v1/admin/bookings' });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.code, 'UNAUTHORIZED');
  });

  await t.test('6. Non-existent route returns 404', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/v1/non-existent-endpoint' });
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.code, 'ROUTE_NOT_FOUND');
  });

  await t.test('7. GET /api/v1/health/rig returns weighbridge & ANPR calibration status', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/v1/health/rig' });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.station, 'STATION PLATFORM #02');
    assert.strictEqual(res.body.data.loadCells.status, 'RIGID_AND_CALIBRATED');
    assert.strictEqual(res.body.data.anprCamera.cameraId, 'ANPR_CAM_02');
  });

  await t.test('8. POST /api/v1/bookings/check-in rejects missing token', async () => {
    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/bookings/check-in',
      body: {}
    });
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.code, 'TOKEN_REQUIRED');
  });

  await t.test('9. POST /api/v1/auth/google authenticates Google account and issues JWT', async () => {
    // 9a. Rejects missing credential
    const missingRes = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {}
    });
    assert.strictEqual(missingRes.statusCode, 400);
    assert.strictEqual(missingRes.body.code, 'GOOGLE_TOKEN_REQUIRED');

    // 9b. Rejects client-supplied email without valid Google ID token credential
    const forgedRes = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {
        email: 'attacker@gmail.com',
        role: 'Admin'
      }
    });
    assert.strictEqual(forgedRes.statusCode, 400);
    assert.strictEqual(forgedRes.body.code, 'GOOGLE_TOKEN_REQUIRED');

    // 9c. Authenticates genuine Google credential with verified token
    const AuthService = require('../src/services/auth.service');
    env.GOOGLE_CLIENT_ID = 'test-agrislot-client-id.apps.googleusercontent.com';
    AuthService.setOAuthClient({
      async verifyIdToken({ idToken, audience }) {
        if (idToken !== 'valid_google_jwt_token_12345') {
          throw new Error('Invalid signature');
        }
        if (audience !== env.GOOGLE_CLIENT_ID) {
          throw new Error('Wrong recipient');
        }
        return {
          getPayload: () => ({
            iss: 'https://accounts.google.com',
            sub: 'google_sub_1092837465',
            email: 'gouravgodara@gmail.com',
            email_verified: true,
            name: 'Gourav Godara',
            picture: 'https://lh3.googleusercontent.com/test'
          })
        };
      }
    });

    const res = await dispatch(app, {
      method: 'POST',
      url: '/api/v1/auth/google',
      body: {
        credential: 'valid_google_jwt_token_12345',
        role: 'Admin' // Should be completely IGNORED by backend!
      }
    });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token, 'Should issue a signed AgriSlot JWT token');
    assert.strictEqual(res.body.data.user.email, 'gouravgodara@gmail.com');
    assert.strictEqual(res.body.data.user.name, 'Gourav Godara');
    assert.strictEqual(res.body.data.user.role, 'Farmer', 'Client-supplied role must not escalate privileges');
    assert.strictEqual(res.body.data.user.provider, 'google');
  });

  await t.test('10. GET /api/v1/notifications returns in-app notifications and unreadCount', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/v1/notifications' });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(typeof res.body.meta?.unreadCount === 'number');
  });

  await t.test('11. GET /api/v1/analytics/operational returns operational metrics breakdown', async () => {
    const res = await dispatch(app, { method: 'GET', url: '/api/v1/analytics/operational' });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.bookings);
    assert.ok(res.body.data.capacity);
    assert.ok(res.body.data.financials);
  });

  await t.test('12. GET /api/v1/auth/me returns current user profile with valid JWT', async () => {
    const jwt = require('jsonwebtoken');
    const UserRepository = require('../src/repositories/user.repository');
    const origFindById = UserRepository.findById;
    UserRepository.findById = async (id) => ({
      User_ID: id,
      Username: 'profile_tester',
      Email: 'tester@agrislot.com',
      Full_Name: 'Profile Tester',
      Avatar_Url: null,
      User_Role: 'Farmer',
      Account_Status: 'Active',
      Farmer_ID: 10,
      Created_At: new Date().toISOString()
    });

    try {
      const token = jwt.sign(
        { userId: 10, username: 'profile_tester', role: 'Farmer' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await dispatch(app, {
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${token}` }
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.username, 'profile_tester');
      assert.strictEqual(res.body.data.role, 'Farmer');
    } finally {
      UserRepository.findById = origFindById;
    }
  });

  await t.test('13. GET /api/v1/admin/users rejects Farmer JWT token with 403 FORBIDDEN', async () => {
    const jwt = require('jsonwebtoken');
    const UserRepository = require('../src/repositories/user.repository');
    const origFindById = UserRepository.findById;
    UserRepository.findById = async (id) => ({
      User_ID: id,
      Username: 'normal_farmer',
      User_Role: 'Farmer',
      Account_Status: 'Active'
    });

    try {
      const token = jwt.sign(
        { userId: 88, username: 'normal_farmer', role: 'Farmer' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await dispatch(app, {
        method: 'GET',
        url: '/api/v1/admin/users',
        headers: { authorization: `Bearer ${token}` }
      });

      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.code, 'FORBIDDEN');
    } finally {
      UserRepository.findById = origFindById;
    }
  });

  await t.test('14. GET /api/v1/admin/users allows active Admin and returns user directory', async () => {
    const jwt = require('jsonwebtoken');
    const UserRepository = require('../src/repositories/user.repository');
    const origFindById = UserRepository.findById;
    const origFindAll = UserRepository.findAll;

    UserRepository.findById = async (id) => ({
      User_ID: id,
      Username: 'admin_officer',
      User_Role: 'Admin',
      Account_Status: 'Active'
    });
    UserRepository.findAll = async () => ({
      users: [
        { User_ID: 1, Username: 'admin_officer', User_Role: 'Admin', Account_Status: 'Active' },
        { User_ID: 2, Username: 'farmer_ramesh', User_Role: 'Farmer', Account_Status: 'Active' }
      ],
      pagination: { total: 2, page: 1, limit: 15, pages: 1 }
    });

    try {
      const token = jwt.sign(
        { userId: 1, username: 'admin_officer', role: 'Admin' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await dispatch(app, {
        method: 'GET',
        url: '/api/v1/admin/users',
        headers: { authorization: `Bearer ${token}` }
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.length, 2);
      assert.strictEqual(res.body.pagination.total, 2);
    } finally {
      UserRepository.findById = origFindById;
      UserRepository.findAll = origFindAll;
    }
  });

  await t.test('15. PATCH /api/v1/admin/users/:id/role rejects self-demotion with 400 CANNOT_DEMOTE_SELF', async () => {
    const jwt = require('jsonwebtoken');
    const UserRepository = require('../src/repositories/user.repository');
    const origFindById = UserRepository.findById;

    UserRepository.findById = async (id) => ({
      User_ID: id,
      Username: 'admin_self',
      User_Role: 'Admin',
      Account_Status: 'Active'
    });

    try {
      const token = jwt.sign(
        { userId: 1, username: 'admin_self', role: 'Admin' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await dispatch(app, {
        method: 'PATCH',
        url: '/api/v1/admin/users/1/role',
        headers: { authorization: `Bearer ${token}` },
        body: { role: 'Farmer' }
      });

      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.code, 'CANNOT_DEMOTE_SELF');
    } finally {
      UserRepository.findById = origFindById;
    }
  });

  await t.test('16. PATCH /api/v1/admin/users/:id/role promotes user to Admin with audit logging', async () => {
    const jwt = require('jsonwebtoken');
    const UserRepository = require('../src/repositories/user.repository');
    const AuditService = require('../src/services/audit.service');

    const origFindById = UserRepository.findById;
    const origUpdateUserRole = UserRepository.updateUserRole;
    const origLogAudit = AuditService.logAudit;

    let targetRole = 'Farmer';
    let auditLogged = false;

    UserRepository.findById = async (id) => {
      if (id === 1) return { User_ID: 1, Username: 'acting_admin', User_Role: 'Admin', Account_Status: 'Active' };
      if (id === 15) return { User_ID: 15, Username: 'promoted_farmer', Email: 'promo@agrislot.com', User_Role: targetRole, Account_Status: 'Active' };
      return null;
    };
    UserRepository.updateUserRole = async (id, role) => {
      if (id === 15) targetRole = role;
    };
    AuditService.logAudit = async () => {
      auditLogged = true;
    };

    try {
      const token = jwt.sign(
        { userId: 1, username: 'acting_admin', role: 'Admin' },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await dispatch(app, {
        method: 'PATCH',
        url: '/api/v1/admin/users/15/role',
        headers: { authorization: `Bearer ${token}` },
        body: { role: 'Admin' }
      });

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.User_Role, 'Admin');
      assert.strictEqual(targetRole, 'Admin');
      assert.strictEqual(auditLogged, true);
    } finally {
      UserRepository.findById = origFindById;
      UserRepository.updateUserRole = origUpdateUserRole;
      AuditService.logAudit = origLogAudit;
    }
  });
});
