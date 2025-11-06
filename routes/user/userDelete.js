const UserService = require("../../services/userService");

// Delete own account (secure endpoint for logged-in users)
const deleteUserAccount = async (req, res) => {
  try {
    const { confirmText } = req.body;

    // User info is available from JWT token (via auth middleware)
    const { username, email } = req.user;

    console.log("Deleting user:", { username, email }); // Debug log

    // Require confirmation text for extra security
    if (confirmText !== "DELETE MY ACCOUNT") {
      return res.status(400).json({
        message: "Please type 'DELETE MY ACCOUNT' to confirm",
      });
    }

    // Find user to make sure they still exist
    const user = await UserService.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the account using username from token
    const deletedUser = await UserService.deleteUser(username);
    if (!deletedUser) {
      return res.status(404).json({ message: "Failed to delete account" });
    }

    res.json({
      message: "Account deleted successfully",
      deletedUsername: deletedUser.username || username,
    });
  } catch (error) {
    console.error("Error deleting own account:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { deleteUserAccount };
