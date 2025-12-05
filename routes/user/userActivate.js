const UserService = require("../../services/userService");

// Activate user account

const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: "Activation token is required" });
    }

    const result = await UserService.activateUserAccount(token);

    res.json({
      message: result.message,
      userName: result.userName,
    });
  } catch (error) {
    console.error("Error activating account:", error);

    if (error.message.includes("invalid or expired")) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes("already activated")) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

// RESEND ACTIVATION EMAIL

const resendActivation = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await UserService.resendActivationEmail(email);

    res.json({
      message: result.message,
    });
  } catch (err) {
    console.error("Error resending activation email:", err);

    if (err.message.includes("User not found")) {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("already activated")) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { activateAccount, resendActivation };
