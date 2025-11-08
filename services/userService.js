// services/userService.js
const User = require("../models/User");
const { getDB } = require("../db"); // Keep for legacy data access
const { nanoid } = require("nanoid");

class UserService {
  // Generate unique username with nanoid suffix if needed
  static async generateUniqueUsername(desiredUsername) {
    try {
      // Clean the desired username (remove special characters, lowercase)
      const cleanUsername = desiredUsername
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") // Remove special characters
        .slice(0, 20); // Limit length

      if (cleanUsername.length < 3) {
        throw new Error(
          "Username must be at least 3 characters long after cleaning"
        );
      }

      // Check if basic username is available
      const existingUser = await User.findOne({ username: cleanUsername });

      if (!existingUser) {
        return cleanUsername;
      }

      // If not available, generate with nanoid suffix
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const suffix = nanoid(4); // 4-character suffix
        const candidateUsername = `${cleanUsername}_${suffix}`;

        const exists = await User.findOne({ username: candidateUsername });

        if (!exists) {
          return candidateUsername;
        }

        attempts++;
      }

      // Fallback - use timestamp
      const timestamp = Date.now().toString().slice(-6);
      return `${cleanUsername}_${timestamp}`;
    } catch (error) {
      throw new Error(`Error generating unique username: ${error.message}`);
    }
  }

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
    const { username, email, password, isActivated = false } = userData;

    try {
      // Check if user already exists in new structure
      const existingUser = await User.findOne({
        $or: [{ username: username }, { email: email }],
      });

      if (existingUser) {
        throw new Error("This email is already used!");
      }

      // Check if user exists in legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find((user) => user.email === email);

        if (legacyUser) {
          throw new Error("This email is already used!");
        }
      }

      // Create new user using Mongoose model
      const newUser = new User({
        username,
        email,
        password,
        isActivated,
      });

      const savedUser = await newUser.save();
      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new Error("This email is already used!");
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
            isActivated: userData.isActivated || false,
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
