// services/userService.js
const {
  UserRepository,
  UserValidator,
  UsernameGenerator,
  UserMigration,
} = require("./modules");

/**
 * UserService - Main business logic layer for user operations
 * Orchestrates calls to specialized modules for clean separation of concerns
 */
class UserService {
  // ========================================
  // USER MANAGEMENT OPERATIONS
  // ========================================

  /**
   * GET ALL USERS FROM THE SYSTEM
   * @returns {Promise<Array>} - Array of all users
   */
  static async getAllUsers() {
    try {
      return await UserRepository.findAll();
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  /**
   * ADD A NEW USER TO THE SYSTEM
   * @param {Object} userData - User data to add
   * @returns {Promise<Object>} - Created user object
   */
  static async addUser(userData) {
    const { username, email, password, isActivated = false } = userData;

    try {
      // Validate user data
      const validation = await UserValidator.validateUserData({
        username,
        email,
        password,
      });

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Create new user
      const newUser = await UserRepository.create({
        username,
        email,
        password,
        isActivated,
      });

      return newUser;
    } catch (error) {
      throw error;
    }
  }

  /**
   * UPDATE USER INFORMATION
   * @param {string} username - Username of user to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated user or null if not found
   */
  static async updateUser(username, updateData) {
    try {
      return await UserRepository.updateByUsername(username, updateData);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  /**
   * DELETE A USER FROM THE SYSTEM
   * @param {string} username - Username of user to delete
   * @returns {Promise<Object|null>} - Deleted user or null if not found
   */
  static async deleteUser(username) {
    try {
      return await UserRepository.deleteByUsername(username);
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // ========================================
  // USER LOOKUP OPERATIONS
  // ========================================

  /**
   * FIND USER BY USERNAME
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findUserByUsername(username) {
    try {
      return await UserRepository.findByUsername(username);
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  /**
   * FIND USER BY EMAIL
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findUserByEmail(email) {
    try {
      return await UserRepository.findByEmail(email);
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // ========================================
  // ALIAS METHODS FOR BACKWARD COMPATIBILITY
  // ========================================

  static async getUserByEmail(email) {
    return this.findUserByEmail(email);
  }

  static async getUserById(username) {
    return this.findUserByUsername(username);
  }

  static async getUserByUsername(username) {
    return this.findUserByUsername(username);
  }

  // ========================================
  // USERNAME GENERATION
  // ========================================

  /**
   * GENERATE A UNIQUE USERNAME BASED ON DESIRED NAME
   * @param {string} desiredUsername - The desired username
   * @returns {Promise<string>} - Unique username
   */
  static async generateUniqueUsername(desiredUsername) {
    try {
      return await UsernameGenerator.generateUniqueUsername(desiredUsername);
    } catch (error) {
      throw new Error(`Error generating unique username: ${error.message}`);
    }
  }

  /**
   * GENERATE MULTIPLE USERNAME SUGGESTIONS
   * @param {string} desiredUsername - The desired username
   * @param {number} count - Number of suggestions (default: 5)
   * @returns {Promise<string[]>} - Array of username suggestions
   */
  static async generateUsernameSuggestions(desiredUsername, count = 5) {
    try {
      return await UsernameGenerator.generateSuggestions(
        desiredUsername,
        count
      );
    } catch (error) {
      throw new Error(
        `Error generating username suggestions: ${error.message}`
      );
    }
  }

  // ========================================
  // VALIDATION HELPERS
  // ========================================

  /**
   * CHECK IF EMAIL IS ALREADY IN USE
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - True if email is taken
   */
  static async isEmailTaken(email) {
    try {
      return await UserValidator.isEmailTaken(email);
    } catch (error) {
      throw new Error(`Error checking email availability: ${error.message}`);
    }
  }

  /**
   * CHECK IF USERNAME IS ALREADY IN USE
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} - True if username is taken
   */
  static async isUsernameTaken(username) {
    try {
      return await UserValidator.isUsernameTaken(username);
    } catch (error) {
      throw new Error(`Error checking username availability: ${error.message}`);
    }
  }

  // ========================================
  // MIGRATION OPERATIONS
  // ========================================

  /**
   * MIGRATE USERS TO NEW STRUCTURE
   * @returns {Promise<Object>} - Migration results
   */
  static async migrateUsersToNewStructure() {
    try {
      return await UserMigration.migrateUsersToNewStructure();
    } catch (error) {
      throw new Error(`Migration error: ${error.message}`);
    }
  }

  /**
   * GET MIGRATION STATUS INFORMATION
   * @returns {Promise<Object>} - Migration status details
   */
  static async getMigrationStatus() {
    try {
      return await UserMigration.getMigrationStatus();
    } catch (error) {
      throw new Error(`Error getting migration status: ${error.message}`);
    }
  }

  /**
   * CREATE BACKUP OF LEGACY USERS BEFORE MIGRATION
   * @returns {Promise<Object>} - Backup result
   */
  static async backupLegacyUsers() {
    try {
      return await UserMigration.backupLegacyUsers();
    } catch (error) {
      throw new Error(`Error creating backup: ${error.message}`);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * GET TOTAL USER COUNT ACROSS ALL STRUCTURES
   * @returns {Promise<number>} - Total number of users
   */
  static async getUserCount() {
    try {
      return await UserRepository.countAll();
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  /**
   * GET USERS WITH PAGINATION
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} - Paginated user results
   */
  static async getUsersWithPagination(criteria = {}, options = {}) {
    try {
      return await UserRepository.findWithPagination(criteria, options);
    } catch (error) {
      throw new Error(`Error getting paginated users: ${error.message}`);
    }
  }
}

module.exports = UserService;
