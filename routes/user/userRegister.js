const registerUser = async (req, res) => {
  try {
    const { id, email, password, avatar } = req.body;

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

    const newUser = await UserService.addUser({ id, email, password, avatar });

    res.status(201).json({
      message: "User added successfully",
      userId: newUser.id,
      user: {
        id: newUser.id,
        email: newUser.email,
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
