const UserService = require("../../services/userService");

// Activate user account - NOW AS API ENDPOINT
const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Activation token is required",
      });
    }

    const result = await UserService.activateUserAccount(token);

    return res.json({
      success: true,
      message: result.message,
      username: result.username,
    });
  } catch (error) {
    console.error("Error activating account:", error);

    // ✅ Użyj statusCode z błędu jeśli istnieje
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal server error";

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
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
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error("Error resending activation email:", err);

    if (err.message.includes("No account found")) {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes("already activated")) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { activateAccount, resendActivation };
