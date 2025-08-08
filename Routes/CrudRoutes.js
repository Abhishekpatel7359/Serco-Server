const express = require("express");
const { buildDynamicQuery, executeQuery } = require("../Services/CrudService");
const authenticate = require("../Middleware/Auth");
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
  const { queryType, table, data, conditions } = decryptedData;






  if (!queryType || !table) {
    return res.status(400).json({ message: "queryType and table are required" });
  }

  try {
    const { query, values } = buildDynamicQuery(queryType, table, data, conditions);
    const encryptedResults = await executeQuery(query, values);
    const results = encrypt(encryptedResults);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database Error", error: err });
  }
});

module.exports = router;
