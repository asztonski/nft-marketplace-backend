const UserService = require("../../services/userService");

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await UserService.deleteUser(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ message: "User deleted successfully", user: deletedUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { deleteUser };
