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

    // Find user by email
    const user = await UserService.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Don't return password in the response
    const { password: userPassword, ...userWithoutPassword } = user.toObject
      ? user.toObject()
      : user;

    res.json({
      message: "Login successful",
      token: token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { loginUser };
