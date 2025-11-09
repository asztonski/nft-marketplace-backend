// services/modules/userMigration.js
const User = require("../../models/User");
const { getDB } = require("../../db");

/**
 USERMIGRATION - MODULE RESPONSIBLE FOR MIGRATING USERS FROM LEGACY STRUCTURE TO NEW MONGOOSE STRUCTURE
 */
class UserMigration {
  /**
   * MIGRATE USERS FROM LEGACY STRUCTURE TO NEW MONGOOSE STRUCTURE
   * @returns {Promise<Object>} - Migration results with counts
   */
  static async migrateUsersToNewStructure() {
    try {
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (!usersDoc || !usersDoc.users) {
        console.log("No legacy users found to migrate");
        return { migrated: 0, skipped: 0, errors: [] };
      }

      let migrated = 0;
      let skipped = 0;
      const errors = [];

      console.log(`Starting migration of ${usersDoc.users.length} users...`);

      for (const userData of usersDoc.users) {
        try {
          const result = await this.migrateUser(userData);

          if (result.success) {
            if (result.action === "migrated") {
              migrated++;
            } else if (result.action === "skipped") {
              skipped++;
            }
          } else {
            errors.push(`${userData.username}: ${result.error}`);
            skipped++;
          }
        } catch (error) {
          const errorMsg = `Error migrating user ${userData.username}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          skipped++;
        }
      }

      const result = { migrated, skipped, errors };
      console.log(
        `Migration completed: ${migrated} users migrated, ${skipped} skipped`
      );

      if (errors.length > 0) {
        console.log("Errors occurred during migration:", errors);
      }

      return result;
    } catch (error) {
      throw new Error(`Migration error: ${error.message}`);
    }
  }

  /**
   * MIGRATE A SINGLE USER FROM LEGACY FORMAT
   * @param {Object} userData - Legacy user data
   * @returns {Promise<Object>} - Migration result for this user
   */
  static async migrateUser(userData) {
    try {
      // Check if user already exists in new structure
      const existingUser = await User.findOne({
        $or: [{ username: userData.username }, { email: userData.email }],
      });

      if (existingUser) {
        return {
          success: true,
          action: "skipped",
          reason: "User already exists in new structure",
        };
      }

      // Validate required fields
      if (!userData.username || !userData.email) {
        return {
          success: false,
          error: "Missing required fields (username or email)",
        };
      }

      // Create new user document
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        isActivated: userData.isActivated || false,
        // Add any additional fields from legacy structure
        ...(userData.avatar && { avatar: userData.avatar }),
        ...(userData.createdAt && { createdAt: userData.createdAt }),
        ...(userData.lastLogin && { lastLogin: userData.lastLogin }),
      });

      await newUser.save();

      return {
        success: true,
        action: "migrated",
        userId: newUser._id,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * CHECK MIGRATION STATUS - HOW MANY USERS ARE IN LEGACY VS NEW STRUCTURE
   * @returns {Promise<Object>} - Status information
   */
  static async getMigrationStatus() {
    try {
      // Count users in new structure
      const newStructureCount = await User.countDocuments({});

      // Count users in legacy structure
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});
      const legacyCount =
        usersDoc && usersDoc.users ? usersDoc.users.length : 0;

      return {
        newStructure: newStructureCount,
        legacyStructure: legacyCount,
        totalUsers: newStructureCount + legacyCount,
        migrationNeeded: legacyCount > 0,
      };
    } catch (error) {
      throw new Error(`Error checking migration status: ${error.message}`);
    }
  }

  /**
   * CREATE BACKUP OF LEGACY USERS BEFORE MIGRATION
   * @returns {Promise<Object>} - Backup result
   */
  static async backupLegacyUsers() {
    try {
      const db = getDB();
      const usersCollection = db.collection("users");
      const usersDoc = await usersCollection.findOne({});

      if (!usersDoc || !usersDoc.users) {
        return {
          success: true,
          message: "No legacy users to backup",
          backupCount: 0,
        };
      }

      // CREATE BACKUP COLLECTION
      const backupCollection = db.collection("users_backup");
      const timestamp = new Date().toISOString();

      await backupCollection.insertOne({
        backupDate: timestamp,
        originalData: usersDoc,
        userCount: usersDoc.users.length,
      });

      return {
        success: true,
        message: `Backup created successfully with ${usersDoc.users.length} users`,
        backupCount: usersDoc.users.length,
        backupDate: timestamp,
      };
    } catch (error) {
      throw new Error(`Error creating backup: ${error.message}`);
    }
  }

  /**
   * CLEANUP LEGACY STRUCTURE AFTER MIGRATION
   * WARNING: THIS WILL REMOVE THE LEGACY USERS ARRAY
   * @param {boolean} force - Force cleanup without confirmation
   * @returns {Promise<Object>} - Cleanup result
   */
  static async cleanupLegacyStructure(force = false) {
    try {
      if (!force) {
        throw new Error(
          "Cleanup requires force parameter to be true for safety"
        );
      }

      // Verify migration is complete
      const status = await this.getMigrationStatus();

      if (status.legacyStructure > 0 && status.newStructure === 0) {
        throw new Error(
          "Cannot cleanup: No users found in new structure but legacy users exist"
        );
      }

      const db = getDB();
      const usersCollection = db.collection("users");

      // Remove the users array from the legacy document
      await usersCollection.updateOne({}, { $unset: { users: "" } });

      return {
        success: true,
        message: "Legacy structure cleaned up successfully",
        removedCount: status.legacyStructure,
      };
    } catch (error) {
      throw new Error(`Error cleaning up legacy structure: ${error.message}`);
    }
  }
}

module.exports = UserMigration;
