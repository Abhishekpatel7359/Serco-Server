const { verifyToken } = require("../Services/AuthService");

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  const payload = verifyToken(token);
  if (!payload) return res.status(403).json({ message: "Forbidden" });

  req.user = payload;
  next();
}

module.exports = authenticate;
