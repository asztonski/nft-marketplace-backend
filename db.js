// db-mongoose.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/?appName=${process.env.MONGO_APP_NAME}`;

    await mongoose.connect(uri, {
      dbName: "nft", // specify the database name
    });

    console.log("✅ Connected to MongoDB Atlas with Mongoose");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

module.exports = { connectDB };
