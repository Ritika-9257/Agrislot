function successResponse(res, { statusCode = 200, message = 'Success', data = null, meta = null, pagination = null }) {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  if (pagination !== null) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
}

function errorResponse(res, { statusCode = 500, message = 'An error occurred', code = 'INTERNAL_SERVER_ERROR', errors = null }) {
  const response = {
    success: false,
    message,
    code
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
}

module.exports = {
  successResponse,
  errorResponse
};
