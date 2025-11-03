// server.js
const express = require("express");
const app = express();
const { connectDB, getDB } = require("./db");

const port = process.env.PORT || 3000;

app.use(express.json());

// --- MongoDB endpoint ---
app.get("/api/users", async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find({}).toArray();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "MongoDB error" });
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

// start server AFTER connecting to MongoDB
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
});
