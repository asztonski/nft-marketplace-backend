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

const MAX_LOGIN_ATTEMPTS = 4;
const LOCK_TIME = 5 * 60 * 1000; // 5 minutes

// Virtual field to check if the account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 }, // Reset attempts after lock period
      $unset: { lockUntil: 1 }, // Remove lock
    }).exec(); // Use exec() to return a promise
  }

  let updates = { $inc: { loginAttempts: 1 } };
  // Lock the account if max attempts reached
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  return this.updateOne(updates).exec();
};

// Method to reset login attempts after successful login
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  }).exec();
};

// Index for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
