// services/userService.js
const User = require("../models/user");
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
    const { id, email, password, avatar = "" } = userData;

    try {
      // Check if user already exists in new structure
      const existingUser = await User.findOne({
        $or: [{ id: id }, { email: email }],
      });

      if (existingUser) {
        throw new Error("User already exists with this id or email");
      }

      // Check if user exists in legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find(
          (user) => user.id === id || user.email === email
        );

        if (legacyUser) {
          throw new Error("User already exists with this id or email");
        }
      }

      // Create new user using Mongoose model
      const newUser = new User({
        id,
        email,
        password,
        avatar,
      });

      const savedUser = await newUser.save();
      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new Error("User already exists with this id or email");
      }
      throw error;
    }
  }

  // Find user by id - checks both structures
  static async findUserById(userId) {
    try {
      // First check new structure
      const mongooseUser = await User.findOne({ id: userId });
      if (mongooseUser) {
        return mongooseUser;
      }

      // Check legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (usersDoc && usersDoc.users) {
        const legacyUser = usersDoc.users.find((user) => user.id === userId);
        if (legacyUser) {
          return legacyUser;
        }
      }

      return null;
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
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
          const existingUser = await User.findOne({ id: userData.id });
          if (existingUser) {
            skipped++;
            continue;
          }

          // Create new user document
          const newUser = new User({
            id: userData.id,
            email: userData.email,
            password: userData.password,
            avatar: userData.avatar || "",
          });

          await newUser.save();
          migrated++;
        } catch (error) {
          console.error(`Error migrating user ${userData.id}:`, error.message);
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
