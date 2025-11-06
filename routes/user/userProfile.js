const UserService = require("../../services/userService");

const getUserProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await UserService.findUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getUserProfile };
