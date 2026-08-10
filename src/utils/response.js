// src/utils/response.js
// توحيد شكل جميع ردود الـ API

function successResponse(res, statusCode, message, data = null) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, statusCode, message, details = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { successResponse, errorResponse };
