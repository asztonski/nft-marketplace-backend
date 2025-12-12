// services/userService.js
const {
  UserRepository,
  UserValidator,
  UsernameGenerator,
  EmailService,
} = require("./modules");
const {
  AccountAlreadyActivatedError,
  InvalidTokenError,
} = require("../utils/customErrors");

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

  /**
   * FIND USER BY EMAIL FOR LOGIN (includes sensitive fields)
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} - User object with login attempts data or null if not found
   */
  static async findUserForLogin(email) {
    try {
      return await UserRepository.findByEmailForLogin(email);
    } catch (error) {
      throw new Error(`Error finding user for login: ${error.message}`);
    }
  }

  /**
   * HANDLE FAILED LOGIN ATTEMPT
   * @param {Object} user - User object
   * @returns {Promise<void>}
   */
  static async handleFailedLogin(user) {
    try {
      if (user.incrementLoginAttempts) {
        await user.incrementLoginAttempts();
      }
    } catch (error) {
      throw new Error(`Error handling failed login: ${error.message}`);
    }
  }

  /**
   * HANDLE SUCCESSFUL LOGIN
   * @param {Object} user - User object
   * @returns {Promise<void>}
   */
  static async handleSuccessfulLogin(user) {
    try {
      if (user.resetLoginAttempts) {
        await user.resetLoginAttempts();
      }
    } catch (error) {
      throw new Error(`Error handling successful login: ${error.message}`);
    }
  }

  /**
   * CHECK IF USER ACCOUNT IS LOCKED
   * @param {Object} user - User object
   * @returns {boolean} - True if account is locked
   */
  static isAccountLocked(user) {
    return user.isLocked || (user.lockUntil && user.lockUntil > Date.now());
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

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * ACTIVATE USER ACCOUNT
   * @param {string} token - Activation token
   * @returns {Promise<Object>} - Activated result
   */
  static async activateUserAccount(token) {
    try {
      const crypto = require("crypto");
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      const user = await UserRepository.findByActivationToken(hashedToken);

      if (!user) {
        throw new InvalidTokenError("Activation token is invalid or expired");
      }

      if (user.isActivated) {
        throw new AccountAlreadyActivatedError("Konto zostało już aktywowane");
      }

      // Activate account and clear token
      await UserRepository.activateUser(user._id);

      return {
        success: true,
        message: "Account successfully activated",
        username: user.username,
      };
    } catch (error) {
      // Przekaż niestandardowe błędy bez modyfikacji
      if (
        error instanceof AccountAlreadyActivatedError ||
        error instanceof InvalidTokenError
      ) {
        throw error;
      }
      throw new Error(`Error activating account: ${error.message}`);
    }
  }

  /**
   * RESEND ACTIVATION EMAIL
   * @param {string} email - User email
   * @returns {Promise<Object>} - Resend result
   */
  static async resendActivationEmail(email) {
    try {
      const user = await UserRepository.findByEmail(email);

      if (!user) {
        throw new Error("No account found with that email. Please register.");
      }

      if (user.isActivated) {
        throw new Error("Account is already activated");
      }

      // Generate new activation token
      const activationToken = user.generateActivationToken();
      await user.save();

      // Send activation email
      await EmailService.sendActivationEmail(
        user.email,
        user.username,
        activationToken
      );

      return {
        success: true,
        message: "Activation email resent successfully",
      };
    } catch (error) {
      throw new Error(`Error resending activation email: ${error.message}`);
    }
  }

  /**
   * CHECK IF USER EXISTS BY EMAIL (for registration form validation)
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} - True if user exists
   */
  static async checkUserExistenceByEmail(email) {
    try {
      const user = await UserRepository.findByEmail(email);
      return !!user;
    } catch (error) {
      throw new Error(`Error checking user existence: ${error.message}`);
    }
  }
}

module.exports = UserService;
