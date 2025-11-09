const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username must be less than 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [4, "Password must be at least 4 characters long"],
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0, // Track failed login attempts
    },
    lockUntil: {
      type: Date,
    },
    // avatar: {
    //   type: String,
    //   default: "",
    //   trim: true,
    // },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: "users", // Use a different collection name to avoid conflicts with legacy data
  }
);

// Index for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
