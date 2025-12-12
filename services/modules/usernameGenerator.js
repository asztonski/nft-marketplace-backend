// services/modules/usernameGenerator.js
const { nanoid } = require("nanoid");
const UserValidator = require("./userValidator");
const {
  USERNAME_CONFIG,
  USERNAME_GENERATOR,
} = require("../../utils/constants");

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
      if (cleanUsername.length < USERNAME_CONFIG.MIN_LENGTH) {
        throw new Error(
          `Username must be at least ${USERNAME_CONFIG.MIN_LENGTH} characters long after cleaning`
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
      .replace(/[^a-zA-Z0-9]/g, "") // Remove special characters
      .slice(0, USERNAME_GENERATOR.MAX_CLEAN_LENGTH); // Limit length
  }

  /**
   * Generate username with suffix when base name is taken
   * @param {string} baseUsername - The base username
   * @returns {Promise<string>} - Username with suffix
   */
  static async generateWithSuffix(baseUsername) {
    const maxAttempts = USERNAME_GENERATOR.MAX_ATTEMPTS;
    let attempts = 0;

    // Try with nanoid suffix
    while (attempts < maxAttempts) {
      const suffix = nanoid(USERNAME_GENERATOR.SUFFIX_LENGTH);
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
}

module.exports = UsernameGenerator;
