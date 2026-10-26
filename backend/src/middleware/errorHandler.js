const { errorResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');
const env = require('../config/env');

function errorHandler(err, req, res, next) {
  // Only log unexpected server errors as [ERROR]; client validation errors are operational
  if (err.name === 'ZodError' || (err.statusCode && err.statusCode < 500)) {
    logger.debug(`Client request error (${req.method} ${req.originalUrl}): ${err.message}`);
  } else {
    logger.error(`Error processing ${req.method} ${req.originalUrl}:`, {
      message: err.message,
      code: err.code,
      stack: env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Custom AppError
  if (err.isOperational) {
    return errorResponse(res, {
      statusCode: err.statusCode || 400,
      message: err.message,
      code: err.code || 'OPERATIONAL_ERROR',
      errors: err.errors || null
    });
  }

  // Zod Validation Error
  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return errorResponse(res, {
      statusCode: 400,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }

  // MySQL Specific Errors
  if (err.code === 'ER_DUP_ENTRY') {
    let message = 'A record with this identifier already exists';
    if (err.message.includes('Phone')) {
      message = 'A farmer with this phone number is already registered';
    } else if (err.message.includes('Aadhar_No')) {
      message = 'A farmer with this Aadhaar number is already registered';
    } else if (err.message.includes('Token_Number')) {
      message = 'A booking with this gate-pass token already exists';
    } else if (err.message.includes('Username')) {
      message = 'A user with this username already exists';
    }
    return errorResponse(res, {
      statusCode: 409,
      message,
      code: 'DUPLICATE_ENTRY'
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return errorResponse(res, {
      statusCode: 400,
      message: 'Invalid foreign key reference: referenced entity does not exist or has active links',
      code: 'FOREIGN_KEY_VIOLATION'
    });
  }

  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return errorResponse(res, {
      statusCode: 400,
      message: 'Data constraint violation: supplied values violate capacity or table rules',
      code: 'CHECK_CONSTRAINT_VIOLATED'
    });
  }

  if (err.code === 'ER_SIGNAL_EXCEPTION') {
    return errorResponse(res, {
      statusCode: 400,
      message: err.sqlMessage || err.message,
      code: 'DATABASE_TRIGGER_EXCEPTION'
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid authorization token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Authorization token has expired. Please login again.',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Default internal server error
  const statusCode = err.status || err.statusCode || 500;
  const message = env.NODE_ENV === 'production' 
    ? 'An unexpected internal server error occurred' 
    : err.message;

  return errorResponse(res, {
    statusCode,
    message,
    code: 'INTERNAL_SERVER_ERROR'
  });
}

class AppError extends Error {
  constructor(message, statusCode = 400, code = 'APP_ERROR', errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  AppError
};
