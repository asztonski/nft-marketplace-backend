// server.js
require("dotenv").config();
const express = require("express");
const app = express();
const { connectDB } = require("./db");
const registerUser = require("./routes/user/userRegister").registerUser;
const getUserList = require("./routes/user/userList").getUsers;
const getUserProfile = require("./routes/user/userProfile").getUserProfile;
const loginUser = require("./routes/user/userLogin").loginUser;
const { logoutUser } = require("./routes/user/userLogout");
const { deleteUserAccount } = require("./routes/user/userDelete");
const { authenticateToken, validateSession } = require("./middleware/auth");
const {
  activateAccount,
  resendActivation,
} = require("./routes/user/userActivate");
const {
  checkUserExistence,
  validateCurrentSession,
} = require("./routes/user/userCheck");

const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// CORS middleware to allow frontend requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes

// VALIDATE SESSION (lightweight check - call periodically from frontend)
app.get("/auth/validate", validateSession, validateCurrentSession);
// GET USER LIST
app.get("/api/users", getUserList);
// GET USER PROFILE
app.get("/api/users/:username", getUserProfile);
// USER LOGIN
app.post("/auth/login", loginUser);
// USER LOGOUT
app.post("/auth/logout", authenticateToken, logoutUser);
// USER REGISTRATION
app.post("/auth/register", registerUser);
// USER ACTIVATION
app.get("/auth/activate/:token", activateAccount);
app.post("/auth/resend-activation", resendActivation);
// CHECK IF EMAIL EXISTS (for registration form)
app.get("/auth/check-email", checkUserExistence);
// DELETE OWN ACCOUNT (secure endpoint with JWT authentication)
app.delete("/api/users/me", authenticateToken, deleteUserAccount);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// start server AFTER connecting to MongoDB
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
      console.log("🚀 Server ready");
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
