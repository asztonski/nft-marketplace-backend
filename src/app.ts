import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { registerUser } from "./features/auth/userRegister.js";
import { getUsers } from "./features/users/userList.js";
import { getUserProfile } from "./features/users/userProfile.js";
import { loginUser } from "./features/auth/userLogin.js";
import { logoutUser } from "./features/auth/userLogout.js";
import { deleteUserAccount } from "./features/users/userDelete.js";
import {
  authenticateToken,
  validateSession,
} from "./shared/middleware/auth.js";
import {
  activateAccount,
  resendActivation,
} from "./features/auth/userActivate.js";
import {
  checkUserExistence,
  validateCurrentSession,
} from "./features/auth/userCheck.js";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// CORS middleware to allow frontend requests
app.use((req: Request, res: Response, next: NextFunction) => {
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
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
