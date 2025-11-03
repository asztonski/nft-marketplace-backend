// server.js
const express = require("express");
const path = require("path");
const app = express();
const { connectDB, getDB } = require("./db");

// use port from env (cPanel provides this) or fallback
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse urlencoded bodies

// simple request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

const cors = require("cors");

const liveOrigin = process.env.LIVE_ORIGIN;

// bezpieczniej: tylko Twojemu lokalnemu devowi i produkcji
app.use(
  cors({
    origin: ["http://localhost:3000", liveOrigin],
  })
);

// serve static files from ./public (e.g. public/index.html)
app.use(express.static(path.join(__dirname, "public")));

// --- Routes ---

// root: original hello world (still served)
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// JSON API: current server time
app.get("/api/time", (req, res) => {
  res.json({ now: new Date().toISOString() });
});

// JSON API: sample users list
const sampleUsers = [
  { id: 1, name: "Alicja" },
  { id: 2, name: "Bartek" },
  { id: 3, name: "Celina" },
];
app.get("/api/users", (req, res) => {
  res.json(sampleUsers);
});

// POST echo: returns the JSON body back to the client
app.post("/api/echo", (req, res) => {
  // returns whatever JSON was sent
  res.json({ received: req.body });
});

// simple health check for load balancers / monitoring
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// 404 handler for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  // otherwise proceed to default static fallback (if any)
  next();
});

// error handler - must have 4 args
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

connectDB().then(() => {
  app.listen(port, () => {
    console.log(
      `App listening on port ${port} (NODE_ENV=${
        process.env.NODE_ENV || "development"
      })`
    );
  });
});

app.get("/api/mongo-users", async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection("users").find({}).toArray();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "MongoDB error" });
  }
});

// start server
app.listen(port, () => {
  console.log(
    `App listening on port ${port} (NODE_ENV=${
      process.env.NODE_ENV || "development"
    })`
  );
});
