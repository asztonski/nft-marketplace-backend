// middleware/auth.js
const jwt = require("jsonwebtoken");
const UserService = require("../services/userService");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user._id || user.username, // Use _id for mongoose, username for legacy
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h", // Token expires in 24 hours
  });
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user to make sure they still exist
    const user = await UserService.findUserByUsername(decoded.username);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Add user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
      });
    } else {
      console.error("Auth middleware error:", error);
      return res.status(500).json({
        message: "Authentication error",
      });
    }
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  JWT_SECRET,
};
