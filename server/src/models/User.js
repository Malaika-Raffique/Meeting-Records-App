import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { isOperationsManagerAccount } from "../utils/operationsManager.js";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["operations_manager", "employee"],
      default: "employee",
      immutable: true,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function generateAccessToken() {
  return jwt.sign(
    { sub: this._id.toString(), role: this.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" },
  );
};

userSchema.methods.generateRefreshToken = function generateRefreshToken() {
  return jwt.sign(
    { sub: this._id.toString() },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" },
  );
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    canManageOperations: isOperationsManagerAccount(this),
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
