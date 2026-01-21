// middleware/auth.ts
import jwt from "jsonwebtoken";
import UserService from "../services/userService.js";
import { TOKEN_EXPIRATION } from "../utils/constants.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    id: user._id || user.username, // Use _id for mongoose, username for legacy
    username: user.username,
    email: user.email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRATION.JWT_EXPIRY,
  });
};

// Verify JWT token middleware - ENHANCED VERSION
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: "Access token required",
        code: "TOKEN_MISSING",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // CRITICAL: Verify user still exists and is active
    const user = await UserService.findUserByUsername(decoded.username);

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
        code: "USER_NOT_FOUND",
        shouldLogout: true,
      });
    }

    // Check if account is still activated
    if (!user.isActivated) {
      return res.status(403).json({
        message: "Account is deactivated",
        code: "ACCOUNT_DEACTIVATED",
        shouldLogout: true,
      });
    }

    // Add user info to request
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      isActivated: user.isActivated,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired",
        code: "TOKEN_EXPIRED",
        shouldLogout: true,
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
        code: "TOKEN_INVALID",
        shouldLogout: true,
      });
    } else {
      console.error("Auth middleware error:", error);
      return res.status(500).json({
        message: "Authentication error",
        code: "AUTH_ERROR",
      });
    }
  }
};

// Lightweight session validation middleware (for frequent checks)
export const validateSession = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        valid: false,
        code: "TOKEN_MISSING",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserService.findUserByUsername(decoded.username);

    if (!user) {
      return res.status(401).json({
        valid: false,
        code: "USER_NOT_FOUND",
        shouldLogout: true,
      });
    }

    if (!user.isActivated) {
      return res.status(403).json({
        valid: false,
        code: "ACCOUNT_DEACTIVATED",
        shouldLogout: true,
      });
    }

    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      isActivated: user.isActivated,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      valid: false,
      code:
        error.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
      shouldLogout: true,
    });
  }
};

export { JWT_SECRET };
