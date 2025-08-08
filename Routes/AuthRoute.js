const express = require("express");
const { generateToken } = require("../Services/AuthService");

const router = express.Router();

router.get("/generate-token", (req, res) => {
  const token = generateToken({ userId: 1, role: "admin" }); // Example payload
  res.json({ token });
});

module.exports = router;
