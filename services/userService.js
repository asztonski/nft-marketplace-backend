// services/userService.js
const User = require("../models/User");
const { getDB } = require("../db"); // Keep for legacy data access

class UserService {
  // Get all users - works with both legacy and new structure
  static async getAllUsers() {
    try {
      // First try to get users from individual documents (new structure)
      const mongooseUsers = await User.find({});

      if (mongooseUsers.length > 0) {
        return mongooseUsers;
      }

      // If no individual users found, check legacy structure (users array in single document)
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        return usersDoc.users;
      }

      return [];
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Add new user - uses Mongoose model (new structure)
  static async addUser(userData) {
    const { username, email, password } = userData;

    try {
      // Check if user already exists in new structure
      const existingUser = await User.findOne({
        $or: [{ username: username }, { email: email }],
      });

      if (existingUser) {
        throw new Error("User already exists with this username or email");
      }

      // Check if user exists in legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find(
          (user) => user.username === username || user.email === email
        );

        if (legacyUser) {
          throw new Error("User already exists with this username or email");
        }
      }

      // Create new user using Mongoose model
      const newUser = new User({
        username,
        email,
        password,
      });

      const savedUser = await newUser.save();
      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new Error("User already exists with this username or email");
      }
      throw error;
    }
  }

  static async updateUser(username, updateData) {
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

  // Delete user - checks both structures
  static async deleteUser(username) {
    try {
      // First try to delete from new structure
      const deletedUser = await User.findOneAndDelete({ username: username });
      if (deletedUser) {
        return deletedUser;
      }

      // If not found, check legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find(
          (user) => user.username === username
        );
        if (legacyUser) {
          // Remove user from legacy array
          usersDoc.users = usersDoc.users.filter(
            (user) => user.username !== username
          );
          await usersCollection.updateOne(
            {},
            { $set: { users: usersDoc.users } }
          );
          return legacyUser;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Find user by username - checks both structures
  static async findUserByUsername(username) {
    try {
      // First check new structure
      const mongooseUser = await User.findOne({ username: username });
      if (mongooseUser) {
        return mongooseUser;
      }

      // Check legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find(
          (user) => user.username === username
        );
        if (legacyUser) {
          return legacyUser;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find user by email - checks both structures
  static async findUserByEmail(email) {
    try {
      // First check new structure
      const mongooseUser = await User.findOne({ email: email });
      if (mongooseUser) {
        return mongooseUser;
      }

      // Check legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find((user) => user.email === email);
        if (legacyUser) {
          return legacyUser;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Error finding user by email: ${error.message}`);
    }
  }

  // Get user by email (alias for findUserByEmail)
  static async getUserByEmail(email) {
    return this.findUserByEmail(email);
  }

  // Alias methods for backward compatibility
  static async getUserById(username) {
    return this.findUserByUsername(username);
  }

  static async getUserByUsername(username) {
    return this.findUserByUsername(username);
  }

  // Migration helper - move users from legacy structure to new structure
  static async migrateUsersToNewStructure() {
    try {
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (!usersDoc || !usersDoc.users) {
        console.log("No legacy users found to migrate");
        return { migrated: 0, skipped: 0 };
      }

      let migrated = 0;
      let skipped = 0;

      for (const userData of usersDoc.users) {
        try {
          // Check if user already exists in new structure
          const existingUser = await User.findOne({
            username: userData.username,
          });
          if (existingUser) {
            skipped++;
            continue;
          }

          // Create new user document
          const newUser = new User({
            username: userData.username,
            email: userData.email,
            password: userData.password,
            // avatar: userData.avatar || "",
          });

          await newUser.save();
          migrated++;
        } catch (error) {
          console.error(
            `Error migrating user ${userData.username}:`,
            error.message
          );
          skipped++;
        }
      }

      console.log(
        `Migration completed: ${migrated} users migrated, ${skipped} skipped`
      );
      return { migrated, skipped };
    } catch (error) {
      throw new Error(`Migration error: ${error.message}`);
    }
  }
}

module.exports = UserService;
