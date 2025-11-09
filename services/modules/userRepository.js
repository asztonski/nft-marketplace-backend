// services/modules/userRepository.js
const User = require("../../models/User");
const { getDB } = require("../../db");

/**
 * USER REPOSITORY - MODULE RESPONSIBLE FOR DATA ACCESS
 * Handles CRUD operations for users in both new and legacy structures
 */
class UserRepository {
  /**
   * Find user by username in both structures
   * @param {string} username - Username to search for
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findByUsername(username) {
    try {
      // First check new structure (Mongoose)
      const mongooseUser = await User.findOne({ username: username });
      if (mongooseUser) {
        return mongooseUser;
      }

      // Check legacy structure
      return await this.findInLegacyStructure({ username });
    } catch (error) {
      throw new Error(`Error finding user by username: ${error.message}`);
    }
  }

  /**
   * Find user by email in both structures
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findByEmail(email) {
    try {
      // First check new structure (Mongoose) - without sensitive fields for general use
      const mongooseUser = await User.findOne({ email: email }).exec();
      if (mongooseUser) {
        return mongooseUser;
      }

      // Check legacy structure
      return await this.findInLegacyStructure({ email });
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
      // First check new structure (Mongoose) with sensitive fields
      const mongooseUser = await User.findOne({ email: email })
        .select("+loginAttempts +lockUntil")
        .exec();

      if (mongooseUser) {
        return mongooseUser;
      }

      // Check legacy structure (legacy users don't have login attempts tracking)
      return await this.findInLegacyStructure({ email });
    } catch (error) {
      throw new Error(
        `Error finding user by email for login: ${error.message}`
      );
    }
  }

  /**
   * Find user in legacy structure
   * @param {Object} criteria - Search criteria (username, email, etc.)
   * @returns {Promise<Object|null>} - User object or null if not found
   */
  static async findInLegacyStructure(criteria) {
    try {
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const user = usersDoc.users.find((user) => {
          if (criteria.username && user.username === criteria.username) {
            return true;
          }
          if (criteria.email && user.email === criteria.email) {
            return true;
          }
          return false;
        });

        return user || null;
      }

      return null;
    } catch (error) {
      throw new Error(`Error searching legacy structure: ${error.message}`);
    }
  }

  /**
   * Get all users from both structures
   * @returns {Promise<Array>} - Array of all users
   */
  static async findAll() {
    try {
      // First try to get users from new structure
      const mongooseUsers = await User.find({});

      if (mongooseUsers.length > 0) {
        return mongooseUsers;
      }

      // If no new users found, check legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        return usersDoc.users;
      }

      return [];
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
      const savedUser = await newUser.save();
      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
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
      const updatedUser = await User.findOneAndUpdate(
        { username: username },
        updateData,
        { new: true }
      );

      return updatedUser;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  /**
   * Delete user by username from both structures
   * @param {string} username - Username of user to delete
   * @returns {Promise<Object|null>} - Deleted user object or null if not found
   */
  static async deleteByUsername(username) {
    try {
      // First try to delete from new structure
      const deletedUser = await User.findOneAndDelete({ username: username });
      if (deletedUser) {
        return deletedUser;
      }

      // If not found, try legacy structure
      return await this.deleteFromLegacyStructure(username);
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  /**
   * Delete user from legacy structure
   * @param {string} username - Username of user to delete
   * @returns {Promise<Object|null>} - Deleted user object or null if not found
   */
  static async deleteFromLegacyStructure(username) {
    try {
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const userIndex = usersDoc.users.findIndex(
          (user) => user.username === username
        );

        if (userIndex !== -1) {
          // Get the user before deletion
          const userToDelete = usersDoc.users[userIndex];

          // Remove user from array
          usersDoc.users.splice(userIndex, 1);

          // Update the document
          await usersCollection.updateOne(
            {},
            { $set: { users: usersDoc.users } }
          );

          return userToDelete;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Error deleting from legacy structure: ${error.message}`);
    }
  }

  /**
   * Count total users in both structures
   * @returns {Promise<number>} - Total number of users
   */
  static async countAll() {
    try {
      // Count in new structure
      const mongooseCount = await User.countDocuments({});

      // Count in legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});
      const legacyCount =
        usersDoc && usersDoc.users ? usersDoc.users.length : 0;

      return mongooseCount + legacyCount;
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
}

module.exports = UserRepository;
