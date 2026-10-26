const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many requests from this IP. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

// Stricter rate limiter for sensitive booking/login endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, {
      statusCode: 429,
      message: 'Too many attempts. Please try again after 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
