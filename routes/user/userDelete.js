const UserService = require("../../services/userService");
const bcrypt = require("bcrypt");

// Delete own account (secure endpoint for logged-in users)
const deleteUserAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // For now, we'll use email from body until JWT auth is implemented
    // TODO: Replace with user ID from JWT token when auth is implemented
    const { email } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Optional: Require confirmation text for extra security
    // if (confirmText !== "DELETE MY ACCOUNT") {
    //   return res.status(400).json({
    //     message: "Please type 'DELETE MY ACCOUNT' to confirm",
    //   });
    // }

    // Find user by email
    const user = await UserService.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Delete the account
    const deletedUser = await UserService.deleteUser(user.username);
    if (!deletedUser) {
      return res.status(404).json({ message: "Failed to delete account" });
    }

    res.json({
      message: "Account deleted successfully",
      deletedUsername: deletedUser.username,
    });
  } catch (error) {
    console.error("Error deleting own account:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { deleteUserAccount };
