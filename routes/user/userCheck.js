const UserService = require("../../services/userService");

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

// VALIDATE CURRENT SESSION - Lightweight check
const validateCurrentSession = async (req, res) => {
  try {
    // req.user comes from validateSession middleware (already verified)
    res.json({
      valid: true,
      user: {
        username: req.user.username,
        email: req.user.email,
        isActivated: req.user.isActivated,
      },
    });
  } catch (error) {
    res.status(500).json({
      valid: false,
      code: "VALIDATION_ERROR",
      error: error.message,
    });
  }
};

module.exports = { checkUserExistence, validateCurrentSession };
