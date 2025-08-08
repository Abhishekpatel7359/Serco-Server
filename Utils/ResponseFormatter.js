/**
 * Standardized response formatter
 */

/**
 * Format success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {object} pagination - Pagination metadata
 * @returns {object} Formatted response
 */
function formatSuccessResponse(data, message = 'Success', pagination = null) {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return response;
}

/**
 * Format error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} error - Error details
 * @returns {object} Formatted error response
 */
function formatErrorResponse(message, statusCode = 500, error = null) {
  const response = {
    success: false,
    message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return response;
}

module.exports = {
  formatSuccessResponse,
  formatErrorResponse
};