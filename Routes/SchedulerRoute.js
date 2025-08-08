const express = require("express");
const { executeQuery, executePaginatedQuery } = require("../Services/CrudService");
const { formatSuccessResponse, formatErrorResponse } = require("../Utils/ResponseFormatter");
const router = express.Router();
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();
// API to create a new scheduled task


router.use(express.json()); 


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





router.post("/schedule", async (req, res) => {
  const {ENCDATA} = req.body;
  const decryptedData = decrypt(ENCDATA);

  const { route, headers, body, run_at, ips } = decryptedData;


  if (!route || !run_at) {
    return res.status(400).json(formatErrorResponse("Route and run_at are required", 400));
  }

  try {
    const query = `
      INSERT INTO ScheduledTasks (route, headers, body, run_at, ips) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [
      route,
      JSON.stringify(headers || {}),
      JSON.stringify(body || {}),
      run_at,
      JSON.stringify(ips || [])
    ];
    await executeQuery(query, values);
    res.status(201).json(formatSuccessResponse(null, "Task scheduled successfully!"));
  } catch (error) {
    console.error("Error scheduling task:", error);
    res.status(500).json(formatErrorResponse("Failed to schedule task", 500, error.message));
  }
});

// Get scheduled tasks with pagination
router.get("/tasks", async (req, res) => {
  const { page, limit, status } = req.query;
  
  try {
    let query = "SELECT * FROM ScheduledTasks";
    let values = [];
    
    if (status) {
      query += " WHERE STATUS = ?";
      values.push(status);
    }
    
    query += " ORDER BY created_at DESC";
    
    if (page || limit) {
      const result = await executePaginatedQuery(query, values, page, limit);
      const response = formatSuccessResponse(result.data, "Scheduled tasks fetched successfully", result.pagination);
      res.json(response);
    } else {
      const tasks = await executeQuery(query, values);
      const response = formatSuccessResponse(tasks, "Scheduled tasks fetched successfully");
      res.json(response);
    }
  } catch (error) {
    console.error("Error fetching scheduled tasks:", error);
    res.status(500).json(formatErrorResponse("Failed to fetch scheduled tasks", 500, error.message));
  }
});

module.exports = router;
