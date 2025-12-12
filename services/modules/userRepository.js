// services/modules/userRepository.js
const User = require("../../models/User");

/**
 * USER REPOSITORY - MODULE RESPONSIBLE FOR DATA ACCESS
 * Handles CRUD operations for users using Mongoose
 */
class UserRepository {
  /**
   * Find user by username
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findByUsername(username) {
    try {
      return await User.findOne({ username });
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  /**
   * Find user by email
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findByEmail(email) {
    try {
      return await User.findOne({ email }).exec();
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  /**
   * Find user by email for login (includes sensitive fields like loginAttempts)
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findByEmailForLogin(email) {
    try {
      return await User.findOne({ email })
        .select("+loginAttempts +lockUntil")
        .exec();
    } catch (error) {
      throw new Error(
        `Error finding user by email for login: ${error.message}`
      );
    }
  }

  /**
   * Get all users
   * @returns {Promise<Array>} - Array of all users
   */
  static async findAll() {
    try {
      return await User.find({});
    } catch (error) {
      throw new Error(`Error fetching all users: ${error.message}`);
    }
  }

  /**
   * Create a new user using Mongoose model
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} - Created user object
   */
  static async create(userData) {
    try {
      const newUser = new User(userData);
      return await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("User with this email or username already exists");
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  /**
   * Update user by username
   * @param {string} username - Username of user to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} - Updated user object or null if not found
   */
  static async updateByUsername(username, updateData) {
    try {
      return await User.findOneAndUpdate({ username }, updateData, {
        new: true,
      });
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  /**
   * Delete user by username
   * @param {string} username - Username of user to delete
   * @returns {Promise<Object|null>} - Deleted user object or null if not found
   */
  static async deleteByUsername(username) {
    try {
      return await User.findOneAndDelete({ username });
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  /**
   * Count total users
   * @returns {Promise<number>} - Total number of users
   */
  static async countAll() {
    try {
      return await User.countDocuments({});
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  /**
   * Find users by criteria with pagination
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Pagination options (limit, skip)
   * @returns {Promise<Object>} - Paginated results
   */
  static async findWithPagination(criteria = {}, options = {}) {
    try {
      const { limit = 10, skip = 0 } = options;

      const users = await User.find(criteria).limit(limit).skip(skip).exec();
      const total = await User.countDocuments(criteria);

      return {
        users,
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      };
    } catch (error) {
      throw new Error(`Error finding users with pagination: ${error.message}`);
    }
  }

  /**
   * Find user by activation token
   * @param {string} hashedToken - Hashed activation token
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findByActivationToken(hashedToken) {
    try {
      return await User.findOne({
        activationToken: hashedToken,
        activationTokenExpires: { $gt: Date.now() },
      }).select("+activationToken +activationTokenExpires");
    } catch (error) {
      throw new Error(
        `Error finding user by activation token: ${error.message}`
      );
    }
  }

  /**
   * Activate user account
   * @param {string} userId - User ID to activate
   * @returns {Promise<Object|null>} - Activated user object or null if not found
   */
  static async activateUser(userId) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        {
          $set: { isActivated: true },
          $unset: { activationToken: 1, activationTokenExpires: 1 },
        },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Error activating user: ${error.message}`);
    }
  }
}

module.exports = UserRepository;
