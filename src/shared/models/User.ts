import mongoose from "mongoose";
import crypto from "crypto";
import {
  LOGIN_SECURITY,
  TOKEN_EXPIRATION,
  USERNAME_CONFIG,
} from "../utils/constants.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [
        USERNAME_CONFIG.MIN_LENGTH,
        `Username must be at least ${USERNAME_CONFIG.MIN_LENGTH} characters long`,
      ],
      maxlength: [
        USERNAME_CONFIG.MAX_LENGTH,
        `Username must be less than ${USERNAME_CONFIG.MAX_LENGTH} characters`,
      ],
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
      // Note: Password is already hashed when saved, so no minlength validation here
      // Validation happens in the route before hashing
    },
    isActivated: {
      type: Boolean,
      default: false,
    },
    activationToken: {
      type: String,
      select: false, // Do not return activation token by default
    },
    activationTokenExpires: {
      type: Date,
      select: false, // Do not return activation token expiration by default
    },
    loginAttempts: {
      type: Number,
      default: 0, // Track failed login attempts
    },
    lockUntil: {
      type: Date,
    },
    avatar: {
      type: String,
      default: "",
      trim: true,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
    collection: "users", // Use a different collection name to avoid conflicts with legacy data
  },
);

const MAX_LOGIN_ATTEMPTS = LOGIN_SECURITY.MAX_ATTEMPTS;
const LOCK_TIME = LOGIN_SECURITY.LOCK_TIME_MS;

// Virtual field to check if the account is locked
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

userSchema.methods.generateActivationToken = function () {
  const token = crypto.randomBytes(20).toString("hex");
  this.activationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.activationTokenExpires =
    Date.now() + TOKEN_EXPIRATION.ACTIVATION_TOKEN_MS;
  return token; // Return unhashed token to send in email
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 }, // Reset attempts after lock period
      $unset: { lockUntil: 1 }, // Remove lock
    }).exec(); // Use exec() to return a promise
  }

  let updates: any = { $inc: { loginAttempts: 1 } };
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

// Index for better performance (unique: true already creates indexes for username and email)
userSchema.index({ activationToken: 1, activationTokenExpires: 1 }); // Index for activation token queries

export default mongoose.model("User", userSchema);
