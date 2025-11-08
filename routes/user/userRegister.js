const bcrypt = require("bcrypt");
const UserService = require("../../services/userService");

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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
      });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long and contain at least one letter and one number",
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

    res.status(201).json({
      message: "User added successfully",
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

    if (err.message.includes("already exists")) {
      return res.status(409).json({ error: err.message });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
module.exports = { registerUser };
