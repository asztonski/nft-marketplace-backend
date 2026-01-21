const logoutUser = async (req, res) => {
  try {
    // W przypadku JWT tokenów, wylogowanie odbywa się głównie po stronie klienta
    // Tutaj możemy dodać dodatkową logikę, np. logowanie aktywności użytkownika

    console.log(
      `User ${req.user.username} (${
        req.user.email
      }) logged out at ${new Date().toISOString()}`
    );

    res.json({
      message:
        "Logout successful. Please remove the token from client storage.",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error during logout:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { logoutUser };
