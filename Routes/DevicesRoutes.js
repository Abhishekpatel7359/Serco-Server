const express = require("express");
const axios = require("axios");
const { formatSuccessResponse, formatErrorResponse } = require("../Utils/ResponseFormatter");
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const authenticate = require("../Middleware/Auth");
const router = express.Router();
dotenv.config();
const https = require("https");

const agent = new https.Agent({  
  rejectUnauthorized: false  // Disables SSL certificate verification
});

// API 1 Configuration
const api1URL = process.env.AV_API;
const api1Headers = {
  cookie: process.env.AV_Header
};

// API 2 Configuration
const api2URL = process.env.PDU_API;
const api2Headers = {
  Authorization: process.env.PDU_Header
};




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
















// console.log("AV", api1URL, api1Headers);
// console.log("PDU", api2URL, api2Headers);

// Helper function to check if the URL is a file path or an actual URL
const isFilePath = (url) => {
  return !url.startsWith("http");
};

// Route to fetch data from API 1 (or local file)
// Middleware API Route
router.get("/AV", authenticate, async (req, res) => {
  const { page, limit } = req.query;
  
  try {
    let data;
    if (isFilePath(api1URL)) {
      // If it's a file, read the JSON data
      data = await fs.readFile(path.join(__dirname, "..", "public", api1URL), "utf8");
      data = JSON.parse(data); // Ensure it's a valid object
    } else {
      // Fetch from external API
      const response = await axios.get(api1URL, { headers: api1Headers, httpsAgent: agent });
      data = response.data;
    }

    // Apply pagination if requested
    if (Array.isArray(data) && (page || limit)) {
      const { calculatePagination } = require("../Utils/Pagination");
      const pagination = calculatePagination(page, limit, data.length);
      const startIndex = pagination.offset;
      const endIndex = startIndex + pagination.itemsPerPage;
      data = data.slice(startIndex, endIndex);
      
      const response = formatSuccessResponse(data, "AV devices fetched successfully", pagination);
      const encryptedResults = encrypt(response);
      res.json({ encryptedData: encryptedResults });
      return;
    }

    // Encrypt data before sending
    const response = formatSuccessResponse(data, "AV devices fetched successfully");
    const results = encrypt(response);
    res.json({ encryptedData: results });
  } catch (error) {
    console.error("Error fetching data from AV Devices:", error.message);
    res.status(500).json(formatErrorResponse("Failed to fetch data from AV Devices", 500, error.message));
  }
});


// Route to fetch data from API 2 (or local file)
// Middleware API Route
router.get("/PDU", authenticate, async (req, res) => {
  const { page, limit } = req.query;
  
  try {
    let data;
    if (isFilePath(api2URL)) {
      // If it's a file, read the JSON data
      data = await fs.readFile(path.join(__dirname, "..", "public", api2URL), "utf8");
      data = JSON.parse(data); // Ensure it's a valid object
    } else {
      // Fetch from external API
      const response = await axios.get(api2URL, { headers: api2Headers, httpsAgent: agent });
      data = response.data;
    }

    // Apply pagination if requested
    if (Array.isArray(data) && (page || limit)) {
      const { calculatePagination } = require("../Utils/Pagination");
      const pagination = calculatePagination(page, limit, data.length);
      const startIndex = pagination.offset;
      const endIndex = startIndex + pagination.itemsPerPage;
      data = data.slice(startIndex, endIndex);
      
      const response = formatSuccessResponse(data, "PDU devices fetched successfully", pagination);
      const encryptedResults = encrypt(response);
      res.json({ encryptedData: encryptedResults });
      return;
    }

    // Encrypt data before sending
    const response = formatSuccessResponse(data, "PDU devices fetched successfully");
    const results = encrypt(response);
    res.json({ encryptedData: results });
  } catch (error) {
    console.error("Error fetching data from PDU Devices:", error.message);
    res.status(500).json(formatErrorResponse("Failed to fetch data from PDU Devices", 500, error.message));
  }
});


module.exports = router;
