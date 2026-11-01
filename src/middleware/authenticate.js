const jwt = require('jsonwebtoken');
const env = require('../config/env');
const UserRepository = require('../repositories/user.repository');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Verify JWT authorization token from header (Bearer <token>)
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Authentication token required in Authorization header (Bearer <token>)',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid or malformed authentication token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Optional authentication middleware: populates req.user if valid token present,
 * but allows unauthenticated access to proceed for public/demo endpoints.
 */
function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Ignore invalid/expired tokens for optional authentication
  }
  next();
}

/**
 * Role-based authorization middleware
 * @param  {...string} roles Allowed roles (e.g., 'Admin', 'Mandi_Officer', 'Farmer')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required before checking permissions',
        code: 'UNAUTHORIZED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, {
        statusCode: 403,
        message: `Forbidden: Access requires one of [${roles.join(', ')}] roles`,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

/**
 * Live database-backed role authorization middleware.
 * Verifies the user's role and account status directly against MySQL,
 * safeguarding against stale tokens after demotion or account suspension.
 */
function requireActiveRole(...roles) {
  return async (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required before checking permissions',
        code: 'UNAUTHORIZED'
      });
    }

    try {
      const dbUser = await UserRepository.findById(req.user.userId);
      if (!dbUser) {
        return errorResponse(res, {
          statusCode: 401,
          message: 'Authenticated account no longer exists in system',
          code: 'USER_NOT_FOUND'
        });
      }

      if (dbUser.Account_Status !== 'Active') {
        return errorResponse(res, {
          statusCode: 403,
          message: `Account is ${dbUser.Account_Status.toLowerCase()}. Access denied.`,
          code: 'ACCOUNT_INACTIVE'
        });
      }

      if (!roles.includes(dbUser.User_Role)) {
        return errorResponse(res, {
          statusCode: 403,
          message: `Access revoked: Current role [${dbUser.User_Role}] is not authorized for administrative operations`,
          code: 'FORBIDDEN'
        });
      }

      // Update in-memory user role with fresh database role
      req.user.role = dbUser.User_Role;
      req.dbUser = dbUser;
      next();
    } catch (err) {
      // In offline / fallback test mode if database is unavailable
      if (!roles.includes(req.user.role)) {
        return errorResponse(res, {
          statusCode: 403,
          message: `Forbidden: Access requires one of [${roles.join(', ')}] roles`,
          code: 'FORBIDDEN'
        });
      }
      next();
    }
  };
}

/**
 * Farmer record isolation: ensures a farmer can only access their own records,
 * while Mandi Officers and Admins can access all records.
 */
function enforceFarmerIsolation(req, res, next) {
  if (!req.user) {
    return next();
  }

  // Admins and Mandi Officers can access any record
  if (req.user.role === 'Admin' || req.user.role === 'Mandi_Officer') {
    return next();
  }

  if (req.user.role === 'Farmer') {
    const targetFarmerId = parseInt(
      req.params.id || req.params.farmerId || req.body?.Farmer_ID || req.query?.farmerId,
      10
    );

    // If token has farmerId and targetFarmerId is specified, ensure match
    if (targetFarmerId && req.user.farmerId && req.user.farmerId !== targetFarmerId) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Forbidden: You cannot access or modify records of another farmer',
        code: 'FORBIDDEN_FARMER_RECORD'
      });
    }
  }

  next();
}

module.exports = {
  authenticate,
  authenticateOptional,
  requireRole,
  requireActiveRole,
  enforceFarmerIsolation
};
