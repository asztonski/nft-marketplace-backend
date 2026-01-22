// utils/constants.js
/**
 * CENTRALIZED CONSTANTS
 * Single source of truth for all magic numbers and configuration values
 */

// ========================================
// PASSWORD VALIDATION
// ========================================
const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
  ERROR_MESSAGE:
    "Password must be at least 8 characters long and contain at least one letter and one number",
};

// ========================================
// USERNAME VALIDATION
// ========================================
const USERNAME_CONFIG = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 30,
  ERROR_MESSAGE: "Username must be between 3 and 30 characters long",
};

// ========================================
// EMAIL VALIDATION
// ========================================
const EMAIL_CONFIG = {
  REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ERROR_MESSAGE: "Please enter a valid email address",
};

// ========================================
// LOGIN SECURITY
// ========================================
const LOGIN_SECURITY = {
  MAX_ATTEMPTS: 5,
  LOCK_TIME_MS: 5 * 60 * 1000, // 5 minutes in milliseconds
  LOCK_TIME_MINUTES: 5,
};

// ========================================
// TOKEN EXPIRATION
// ========================================
const TOKEN_EXPIRATION = {
  ACTIVATION_TOKEN_HOURS: 24,
  ACTIVATION_TOKEN_MS: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_HOURS: 1,
  PASSWORD_RESET_MS: 60 * 60 * 1000, // 1 hour
  JWT_EXPIRY: "24h",
};

// ========================================
// USERNAME GENERATOR
// ========================================
const USERNAME_GENERATOR = {
  MAX_ATTEMPTS: 10,
  SUFFIX_LENGTH: 4,
  MAX_CLEAN_LENGTH: 20,
};

export {
  PASSWORD_CONFIG,
  USERNAME_CONFIG,
  EMAIL_CONFIG,
  LOGIN_SECURITY,
  TOKEN_EXPIRATION,
  USERNAME_GENERATOR,
};
