// server.js
const express = require("express");
const app = express();
const { connectDB } = require("./db");
const { connectDB: connectMongoose } = require("./db-mongoose");
const UserService = require("./services/userService");

const port = process.env.PORT || 3000;

// Middleware
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

// --- User endpoints (using Mongoose) ---
app.get("/api/users", async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Add new user endpoint (using Mongoose)
app.post("/api/users", async (req, res) => {
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
});

// Get user by ID endpoint
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserService.findUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't return password in the response
    const { password, ...userWithoutPassword } = user.toObject
      ? user.toObject()
      : user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Migration endpoint - optional, for migrating legacy data
app.post("/api/migrate-users", async (req, res) => {
  try {
    const result = await UserService.migrateUsersToNewStructure();
    res.json({
      message: "Migration completed",
      ...result,
    });
  } catch (err) {
    console.error("Migration error:", err);
    res.status(500).json({ error: "Migration failed" });
  }
});

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
