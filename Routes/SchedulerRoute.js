const express = require("express");
const { executeQuery } = require("../Services/CrudService");
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

  const { route, headers, body, run_at } = decryptedData;


  if (!route || !run_at) {
    return res.status(400).json({ message: "Route and run_at are required." });
  }

  try {
    const query = `
      INSERT INTO ScheduledTasks (route, headers, body, run_at) 
      VALUES (?, ?, ?, ?)
    `;
    const values = [
      route,
      JSON.stringify(headers || {}),
      JSON.stringify(body || {}),
      run_at,
    ];
    await executeQuery(query, values);
    res.status(201).json({ message: "Task scheduled successfully!" });
  } catch (error) {
    console.error("Error scheduling task:", error);
    res.status(500).json({ message: "Failed to schedule task." });
  }
});

module.exports = router;
