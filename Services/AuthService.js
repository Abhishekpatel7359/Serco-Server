const crypto = require("crypto");

const SECRET_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiJ9.JeZAxtiU+pyqnV5HhsirDfpSARX9SWN2lyYvRJx+tRY=";

// Generate JWT
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${body}`).digest("base64");
  return `${header}.${body}.${signature}`;
}

// Verify JWT
function verifyToken(token) {
  try {
    const [header, body, signature] = token.split(".");
    const validSignature = crypto.createHmac("sha256", SECRET_KEY).update(`${header}.${body}`).digest("base64");
    return signature === validSignature ? JSON.parse(Buffer.from(body, "base64").toString()) : null;
  } catch (err) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
