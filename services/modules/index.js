// services/modules/index.js
/**
 * Central export file for all user service modules
 * Provides easy access to all user-related functionality
 */

const UserRepository = require("./userRepository");
const UserValidator = require("./userValidator");
const UsernameGenerator = require("./usernameGenerator");
const EmailService = require("../email/emailService");

module.exports = {
  UserRepository,
  UserValidator,
  UsernameGenerator,
  EmailService,
};
