// db.js
const { MongoClient } = require("mongodb");

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/?appName=${process.env.MONGO_APP_NAME}`;

const client = new MongoClient(uri);

let db;

async function connectDB() {
  try {
    await client.connect();
    db = client.db("nft");
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}

function getDB() {
  if (!db) throw new Error("Database not connected. Call connectDB() first.");
  return db;
}

module.exports = { connectDB, getDB };
