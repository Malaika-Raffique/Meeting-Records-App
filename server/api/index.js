import mongoose from "mongoose";
import app from "../src/app.js";

let isConnected = false;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!isConnected) {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI environment variable is missing");
    }
    await mongoose.connect(mongoUri);
    isConnected = true;
  }
}

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Database connection failed in serverless function:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
}
