/**
 * Pagination utility functions
 */

/**
 * Calculate pagination metadata
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total number of items
 * @returns {object} Pagination metadata
 */
function calculatePagination(page, limit, totalCount) {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const itemsPerPage = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const offset = (currentPage - 1) * itemsPerPage;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  return {
    currentPage,
    itemsPerPage,
    offset,
    totalPages,
    totalCount,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    previousPage: currentPage > 1 ? currentPage - 1 : null
  };
}

/**
 * Build pagination query for MySQL
 * @param {string} baseQuery - Base SQL query
 * @param {number} limit - Items per page
 * @param {number} offset - Offset for pagination
 * @returns {string} Query with LIMIT and OFFSET
 */
function buildPaginatedQuery(baseQuery, limit, offset) {
  return `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Build count query from base query
 * @param {string} baseQuery - Base SQL query
 * @returns {string} Count query
 */
function buildCountQuery(baseQuery) {
  // Remove ORDER BY clause for count query
  const queryWithoutOrder = baseQuery.replace(/ORDER BY.*$/i, '').trim();
  
  // If it's a simple SELECT, wrap it in a subquery
  if (queryWithoutOrder.toLowerCase().startsWith('select')) {
    return `SELECT COUNT(*) as total FROM (${queryWithoutOrder}) as count_query`;
  }
  
  return queryWithoutOrder;
}

module.exports = {
  calculatePagination,
  buildPaginatedQuery,
  buildCountQuery
};