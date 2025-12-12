const UserService = require("../../services/userService");

// GET CURRENT USER PROFILE (from JWT token)
const getCurrentUser = async (req, res) => {
  try {
    // req.user comes from authenticateToken middleware
    const userId = req.user.userId; // or req.user.id depending on your JWT payload

    const user = await UserService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        exists: false,
      });
    }

    // Don't send sensitive data
    const { password, activationToken, ...safeUserData } = user;

    res.json({
      exists: true,
      user: safeUserData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CHECK IF USER EXISTS BY EMAIL (public endpoint for registration form)
const checkUserExistence = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const exists = await UserService.checkUserExistenceByEmail(email);
    res.json({ exists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getCurrentUser, checkUserExistence };
