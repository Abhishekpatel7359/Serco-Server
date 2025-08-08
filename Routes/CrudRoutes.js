const express = require("express");
const { buildDynamicQuery, executeQuery, executePaginatedQuery } = require("../Services/CrudService");
const authenticate = require("../Middleware/Auth");
const { formatSuccessResponse, formatErrorResponse } = require("../Utils/ResponseFormatter");
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();


const ENCRYPTION_KEY= process.env.ENCRYPTION_KEY;
const IV=process.env.IV;
const decrypt = (ciphertext) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(IV));
  let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};






// Function to encrypt data
const encrypt = (data) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(IV));
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
};



router.post("/", authenticate, async (req, res) => {

  const {ENCDATA} = req.body;
  const decryptedData = decrypt(ENCDATA);
  const { queryType, table, data, conditions, page, limit, orderBy, sortDirection } = decryptedData;






  if (!queryType || !table) {
    return res.status(400).json(formatErrorResponse("queryType and table are required", 400));
  }

  try {
    const options = { orderBy, sortDirection };
    const { query, values } = buildDynamicQuery(queryType, table, data, conditions, options);
    
    let result;
    
    // Apply pagination for select queries
    if (queryType.toLowerCase() === 'select' && (page || limit)) {
      result = await executePaginatedQuery(query, values, page, limit);
      const encryptedResults = encrypt(result);
      res.json(encryptedResults);
    } else {
      const queryResult = await executeQuery(query, values);
      const response = formatSuccessResponse(queryResult, "Query executed successfully");
      const encryptedResults = encrypt(response);
      res.json(encryptedResults);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json(formatErrorResponse("Database Error", 500, err.message));
  }
});

module.exports = router;
