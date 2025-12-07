const UserService = require("../../services/userService");

// Activate user account

const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const url = process.env.FRONTEND_URL || "http://localhost:3000";

    if (!token) {
      return res.redirect(
        `${url}/activation-error?message=${encodeURIComponent(
          "Activation token is required"
        )}`
      );
    }

    const result = await UserService.activateUserAccount(token);

    // Redirect to frontend success page with username
    return res.redirect(
      `${url}/account-activated?username=${encodeURIComponent(result.userName)}`
    );
  } catch (error) {
    console.error("Error activating account:", error);

    // Redirect to frontend error page with error message
    let errorMessage = "Internal server error";

    if (error.message.includes("invalid or expired")) {
      errorMessage = error.message;
    } else if (error.message.includes("already activated")) {
      errorMessage = error.message;
    }

    return res.redirect(
      `${url}/activation-error?message=${encodeURIComponent(errorMessage)}`
    );
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
