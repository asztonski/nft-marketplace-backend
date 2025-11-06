// server.js
require("dotenv").config();
const express = require("express");
const app = express();
const { connectDB } = require("./db");
const { connectDB: connectMongoose } = require("./db-mongoose");
const registerUser = require("./routes/user/userRegister").registerUser;
const getUserList = require("./routes/user/userList").getUsers;
const getUserProfile = require("./routes/user/userProfile").getUserProfile;
const loginUser = require("./routes/user/userLogin").loginUser;

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

// GET USER LIST
app.get("/api/users", getUserList);
// GET USER PROFILE
app.get("/api/users/:id", getUserProfile);
// USER LOGIN
app.post("/auth/login", loginUser);
// USER REGISTRATION
app.post("/auth/register", registerUser);
// USER DELETION
app.delete("/api/users/:id", deleteUser);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// start server AFTER connecting to both MongoDB and Mongoose
Promise.all([connectDB(), connectMongoose()])
  .then(() => {
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
      console.log("🚀 Server ready with Mongoose integration");
    });
  })
  .catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
  });
