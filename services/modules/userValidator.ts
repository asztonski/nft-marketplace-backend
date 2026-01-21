// services/modules/userValidator.ts
import User from "../../models/User.js";
import {
  USERNAME_CONFIG,
  EMAIL_CONFIG,
  PASSWORD_CONFIG,
} from "../../utils/constants.js";

/**
 * UserValidator - Module responsible for user validation logic
 * Handles checking for duplicate users
 */
class UserValidator {
  /**
   * Check if a user already exists by email or username
   * @param {string} email - User email to check
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - Returns true if user exists, false otherwise
   */
  static async userExists(email, username = null) {
    try {
      const query = username ? { $or: [{ email }, { username }] } : { email };

      const existingUser = await User.findOne(query);
      return !!existingUser;
    } catch (error) {
      throw new Error(`Error checking if user exists: ${error.message}`);
    }
  }

  /**
   * Check if email is already in use
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - Returns true if email is taken
   */
  static async isEmailTaken(email) {
    try {
      const existingUser = await User.findOne({ email });
      return !!existingUser;
    } catch (error) {
      throw new Error(`Error checking email availability: ${error.message}`);
    }
  }

  /**
   * Check if username is already in use
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - Returns true if username is taken
   */
  static async isUsernameTaken(username) {
    try {
      const existingUser = await User.findOne({ username });
      return !!existingUser;
    } catch (error) {
      throw new Error(`Error checking username availability: ${error.message}`);
    }
  }

  /**
   * Validate user data before creation
   * @param {Object} userData - User data to validate
   * @returns {Promise<Object>} - Validation result with success/error info
   */
  static async validateUserData(userData) {
    const { username, email, password } = userData;
    const errors = [];

    // Username validation
    if (!username || username.length < USERNAME_CONFIG.MIN_LENGTH) {
      errors.push(USERNAME_CONFIG.ERROR_MESSAGE);
    }

    // Email validation
    if (!email || !EMAIL_CONFIG.REGEX.test(email)) {
      errors.push(EMAIL_CONFIG.ERROR_MESSAGE);
    }

    // Password validation
    if (!password || !PASSWORD_CONFIG.REGEX.test(password)) {
      errors.push(PASSWORD_CONFIG.ERROR_MESSAGE);
    }

    // Check for existing user
    if (username && email) {
      const userExists = await this.userExists(email, username);
      if (userExists) {
        errors.push("This email is already used!");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default UserValidator;
