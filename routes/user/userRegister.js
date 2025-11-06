const bcrypt = require("bcrypt");
const UserService = require("../../services/userService");

const registerUser = async (req, res) => {
  try {
    const { id, email, password } = req.body;

    // Validate required fields
    if (!id || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields: id, email, and password are required",
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

    // ID regex: must start with an uppercase letter, followed by lowercase letters and numbers, 3-20 characters
    const idRegex = /^[A-Z][a-z0-9]{2,19}$/;
    if (!idRegex.test(id)) {
      return res.status(400).json({
        error:
          "Invalid id format: must be 3-20 characters, start with an uppercase letter, and contain only lowercase letters and numbers",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: "User with this email already exists",
      });
    }

    const newUser = await UserService.addUser({
      id,
      email,
      password: hashedPassword,
      avatar,
    });

    res.status(201).json({
      message: "User added successfully",
      userId: newUser.id,
      user: {
        id: newUser.id,
        email: newUser.email,
        password: newUser.password,
        avatar: newUser.avatar,
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
