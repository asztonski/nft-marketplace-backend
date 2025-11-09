const bcrypt = require("bcrypt");
const UserService = require("../../services/userService");
const { generateToken } = require("../../middleware/auth");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Missing required fields: email and password are required",
      });
    }

    // Find user by email with login attempt data
    const user = await UserService.findUserForLogin(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if account is locked
    if (UserService.isAccountLocked(user)) {
      const lockTime = user.lockUntil ? new Date(user.lockUntil) : null;
      const remainingTime = lockTime
        ? Math.ceil((lockTime - Date.now()) / 60000)
        : 0;

      return res.status(423).json({
        error:
          "Account temporarily locked due to too many failed login attempts",
        lockedUntil: lockTime,
        remainingMinutes: remainingTime > 0 ? remainingTime : 0,
      });
    }

    // Compare password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Handle failed login attempt
      await UserService.handleFailedLogin(user);

      // Get updated user data to check if account is now locked
      const updatedUser = await UserService.findUserForLogin(email);

      if (UserService.isAccountLocked(updatedUser)) {
        return res.status(423).json({
          error:
            "Account locked due to too many failed login attempts. Please try again in 15 minutes.",
          lockedUntil: updatedUser.lockUntil,
        });
      }

      const remainingAttempts = 4 - (updatedUser.loginAttempts || 0);
      return res.status(401).json({
        error: "Invalid email or password",
        remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
      });
    }

    // Handle successful login
    await UserService.handleSuccessfulLogin(user);

    // Generate JWT token
    const token = generateToken(user);

    // Don't return password in the response
    const {
      password: userPassword,
      loginAttempts,
      lockUntil,
      ...userWithoutSensitiveData
    } = user.toObject ? user.toObject() : user;

    res.json({
      message: "Login successful",
      token: token,
      user: userWithoutSensitiveData,
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { loginUser };
