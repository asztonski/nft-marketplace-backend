const express = require("express");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/user");

const port = process.env.PORT || 3000;

app.use(express.json());

// --- Połączenie z MongoDB ---
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// --- GET: pobierz wszystkich użytkowników ---
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "MongoDB error" });
  }
});

// --- POST: dodaj użytkownika ---
app.post("/api/users", async (req, res) => {
  try {
    const { id, email, password, avatar = "" } = req.body;

    if (!id || !email || !password) {
      return res
        .status(400)
        .json({ error: "id, email and password are required" });
    }

    // Sprawdź, czy użytkownik już istnieje
    const exists = await User.findOne({ $or: [{ id }, { email }] });
    if (exists) {
      return res
        .status(400)
        .json({ error: "User with same id or email already exists" });
    }

    const newUser = new User({ id, email, password, avatar });
    await newUser.save();

    res.status(201).json({ message: "User added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "MongoDB error" });
  }
});

// --- 404 i error handler ---
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => console.log(`App listening on port ${port}`));
