// server.ts
import "dotenv/config";
import express from "express";
import { connectDB } from "./db.js";
import { registerUser } from "./routes/user/userRegister.js";
import { getUsers } from "./routes/user/userList.js";
import { getUserProfile } from "./routes/user/userProfile.js";
import { loginUser } from "./routes/user/userLogin.js";
import { logoutUser } from "./routes/user/userLogout.js";
import { deleteUserAccount } from "./routes/user/userDelete.js";
import { authenticateToken, validateSession } from "./middleware/auth.js";
import {
  activateAccount,
  resendActivation,
} from "./routes/user/userActivate.js";
import {
  checkUserExistence,
  validateCurrentSession,
} from "./routes/user/userCheck.js";

const app = express();

const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// CORS middleware to allow frontend requests
app.use((req: any, res: any, next: any) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
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
app.get("/api/users", getUsers);
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
app.use((req: any, res: any) => {
  res.status(404).json({ error: "Not found" });
});

// error handler
app.use((err: any, req: any, res: any, next: any) => {
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
