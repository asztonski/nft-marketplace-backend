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
      username: result.userName,
    });
  } catch (error) {
    console.error("Error activating account:", error);

    let statusCode = 500;
    let errorMessage = "Internal server error";

    if (error.message.includes("Invalid or expired")) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes("already activated")) {
      statusCode = 400;
      errorMessage = error.message;
    }

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
