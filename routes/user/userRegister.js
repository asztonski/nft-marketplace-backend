const bcrypt = require("bcrypt");
const UserService = require("../../services/userService");
const { EmailService } = require("../../services/modules");
const { PASSWORD_CONFIG, EMAIL_CONFIG } = require("../../utils/constants");

const registerUser = async (req, res) => {
  try {
    const { username: desiredUsername, email, password } = req.body;

    // Validate required fields
    if (!desiredUsername || !email || !password) {
      return res.status(400).json({
        error:
          "Missing required fields: username, email, and password are required",
      });
    }

    // Validate email format
    if (!EMAIL_CONFIG.REGEX.test(email)) {
      return res.status(400).json({
        error: EMAIL_CONFIG.ERROR_MESSAGE,
      });
    }

    if (!PASSWORD_CONFIG.REGEX.test(password)) {
      return res.status(400).json({
        error: PASSWORD_CONFIG.ERROR_MESSAGE,
      });
    }

    // Generate unique username from desired username
    const username = await UserService.generateUniqueUsername(desiredUsername);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with generated unique username
    const newUser = await UserService.addUser({
      username,
      email,
      password: hashedPassword,
    });

    // Generate activation token
    const activationToken = newUser.generateActivationToken();
    await newUser.save();

    // Send activation email
    try {
      await EmailService.sendActivationEmail(
        newUser.email,
        newUser.username,
        activationToken
      );
    } catch (emailError) {
      console.error("Failed to send activation email:", emailError);
      // Continue with registration even if email fails
    }

    res.status(201).json({
      message:
        "User added successfully. Please check your email to activate your account.",
      username: newUser.username,
      desiredUsername: desiredUsername,
      isUsernameModified:
        newUser.username !==
        desiredUsername
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20),
      user: {
        username: newUser.username,
        email: newUser.email,
        isActivated: newUser.isActivated,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error adding user:", err);
    if (err.message.includes("This email is already used!")) {
      return res.status(409).json({ error: err.message });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = { registerUser };
