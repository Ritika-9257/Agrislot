const { errorResponse } = require('../utils/apiResponse');

function notFound(req, res, next) {
  return errorResponse(res, {
    statusCode: 404,
    message: `Resource not found at ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND'
  });
}

module.exports = notFound;
