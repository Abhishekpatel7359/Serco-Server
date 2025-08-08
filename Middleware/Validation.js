/**
 * Request validation middleware
 */

/**
 * Validate pagination parameters
 */
function validatePagination(req, res, next) {
  const { page, limit } = req.query;
  
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive integer',
      statusCode: 400
    });
  }
  
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be a positive integer between 1 and 100',
      statusCode: 400
    });
  }
  
  next();
}

/**
 * Validate IP address format
 */
function validateIP(ip) {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

/**
 * Validate ping request
 */
function validatePingRequest(req, res, next) {
  const { ip, ips, numPings } = req.body;
  
  if (ip && !validateIP(ip)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid IP address format',
      statusCode: 400
    });
  }
  
  if (ips) {
    if (!Array.isArray(ips)) {
      return res.status(400).json({
        success: false,
        message: 'IPs must be an array',
        statusCode: 400
      });
    }
    
    for (const ipAddr of ips) {
      if (!validateIP(ipAddr)) {
        return res.status(400).json({
          success: false,
          message: `Invalid IP address format: ${ipAddr}`,
          statusCode: 400
        });
      }
    }
  }
  
  if (numPings && (isNaN(numPings) || parseInt(numPings) < 1 || parseInt(numPings) > 10)) {
    return res.status(400).json({
      success: false,
      message: 'numPings must be a positive integer between 1 and 10',
      statusCode: 400
    });
  }
  
  next();
}

module.exports = {
  validatePagination,
  validatePingRequest,
  validateIP
};