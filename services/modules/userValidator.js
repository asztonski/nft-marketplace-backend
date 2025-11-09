// services/modules/userValidator.js
const User = require("../../models/User");
const { getDB } = require("../../db");

/**
 * UserValidator - Module responsible for user validation logic
 * Handles checking for duplicate users in both new and legacy structures
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
      // Check new structure (Mongoose)
      const query = username
        ? { $or: [{ email: email }, { username: username }] }
        : { email: email };

      const existingUser = await User.findOne(query);

      if (existingUser) {
        return true;
      }

      // Check legacy structure
      return await this.checkLegacyStructure(email, username);
    } catch (error) {
      throw new Error(`Error checking if user exists: ${error.message}`);
    }
  }

  /**
   * Check if user exists in legacy structure
   * @param {string} email - User email to check
   * @param {string} username - Username to check (optional)
   * @returns {Promise<boolean>} - Returns true if user exists in legacy structure
   */
  static async checkLegacyStructure(email, username = null) {
    try {
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find((user) => {
          if (username) {
            return user.email === email || user.username === username;
          }
          return user.email === email;
        });

        return !!legacyUser;
      }

      return false;
    } catch (error) {
      throw new Error(`Error checking legacy structure: ${error.message}`);
    }
  }

  /**
   * Check if email is already in use
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - Returns true if email is taken
   */
  static async isEmailTaken(email) {
    return await this.userExists(email);
  }

  /**
   * Check if username is already in use
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - Returns true if username is taken
   */
  static async isUsernameTaken(username) {
    try {
      // Check new structure
      const existingUser = await User.findOne({ username: username });
      if (existingUser) {
        return true;
      }

      // Check legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find(
          (user) => user.username === username
        );
        return !!legacyUser;
      }

      return false;
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

    // Basic validation
    if (!username || username.length < 3) {
      errors.push("Username must be at least 3 characters long");
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errors.push("Valid email address is required");
    }

    if (!password || password.length < 6) {
      errors.push("Password must be at least 6 characters long");
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
      errors: errors,
    };
  }
}

module.exports = UserValidator;
