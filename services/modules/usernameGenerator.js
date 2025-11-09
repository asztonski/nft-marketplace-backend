// services/modules/usernameGenerator.js
const { nanoid } = require("nanoid");
const UserValidator = require("./userValidator");

/**
 * USERNAME GENERATOR MODULE
 * HANDLES USERNAME CREATION AND VALIDATION LOGIC
 */
class UsernameGenerator {
  /**
   * Generate a unique username based on desired name
   * @param {string} desiredUsername - The desired username
   * @returns {Promise<string>} - Returns a unique username
   */
  static async generateUniqueUsername(desiredUsername) {
    try {
      // Clean the desired username
      const cleanUsername = this.cleanUsername(desiredUsername);

      // Validate minimum length
      if (cleanUsername.length < 3) {
        throw new Error(
          "Username must be at least 3 characters long after cleaning"
        );
      }

      // Check if basic username is available
      const isBasicTaken = await UserValidator.isUsernameTaken(cleanUsername);

      if (!isBasicTaken) {
        return cleanUsername;
      }

      // Generate username with suffix
      return await this.generateWithSuffix(cleanUsername);
    } catch (error) {
      throw new Error(`Error generating unique username: ${error.message}`);
    }
  }

  /**
   * Clean username by removing special characters and limiting length
   * @param {string} username - Username to clean
   * @returns {string} - Cleaned username
   */
  static cleanUsername(username) {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") // Remove special characters
      .slice(0, 20); // Limit length
  }

  /**
   * Generate username with suffix when base name is taken
   * @param {string} baseUsername - The base username
   * @returns {Promise<string>} - Username with suffix
   */
  static async generateWithSuffix(baseUsername) {
    const maxAttempts = 10;
    let attempts = 0;

    // Try with nanoid suffix
    while (attempts < maxAttempts) {
      const suffix = nanoid(4); // 4-character suffix
      const candidateUsername = `${baseUsername}_${suffix}`;

      const isTaken = await UserValidator.isUsernameTaken(candidateUsername);

      if (!isTaken) {
        return candidateUsername;
      }

      attempts++;
    }

    // Fallback - use timestamp
    const timestamp = Date.now().toString().slice(-6);
    return `${baseUsername}_${timestamp}`;
  }

  /**
   * Validate username format
   * @param {string} username - Username to validate
   * @returns {Object} - Validation result
   */
  static validateUsernameFormat(username) {
    const errors = [];

    if (!username) {
      errors.push("Username is required");
      return { isValid: false, errors };
    }

    if (username.length < 3) {
      errors.push("Username must be at least 3 characters long");
    }

    if (username.length > 30) {
      errors.push("Username must be no more than 30 characters long");
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push(
        "Username can only contain letters, numbers, and underscores"
      );
    }

    if (/^_|_$/.test(username)) {
      errors.push("Username cannot start or end with underscore");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Generate multiple username suggestions
   * @param {string} desiredUsername - The desired username
   * @param {number} count - Number of suggestions to generate
   * @returns {Promise<string[]>} - Array of username suggestions
   */
  static async generateSuggestions(desiredUsername, count = 5) {
    const suggestions = [];
    const baseUsername = this.cleanUsername(desiredUsername);

    try {
      // Add the basic cleaned username if available
      const isBasicTaken = await UserValidator.isUsernameTaken(baseUsername);
      if (!isBasicTaken) {
        suggestions.push(baseUsername);
      }

      // Generate additional suggestions
      while (suggestions.length < count) {
        const suffix = nanoid(3 + Math.floor(Math.random() * 3)); // 3-5 character suffix
        const suggestion = `${baseUsername}_${suffix}`;

        const isTaken = await UserValidator.isUsernameTaken(suggestion);
        if (!isTaken && !suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      }

      return suggestions;
    } catch (error) {
      throw new Error(
        `Error generating username suggestions: ${error.message}`
      );
    }
  }
}

module.exports = UsernameGenerator;
