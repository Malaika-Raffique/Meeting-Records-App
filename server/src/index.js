import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";

const port = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";
const configErrors = [];
const configWarnings = [];

for (const key of ["MONGO_URI", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"]) {
  if (!process.env[key]) configErrors.push(`Missing ${key}`);
}

if (process.env.ACCESS_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET.length < 32) {
  configWarnings.push("ACCESS_TOKEN_SECRET should be at least 32 characters");
}
if (process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.length < 32) {
  configWarnings.push("REFRESH_TOKEN_SECRET should be at least 32 characters");
}
if (
  process.env.ACCESS_TOKEN_SECRET &&
  process.env.REFRESH_TOKEN_SECRET &&
  process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET
) {
  configErrors.push("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different");
}
if (isProduction) {
  const origins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (!origins.length) configErrors.push("CLIENT_ORIGIN is required in production");
  if (origins.some((origin) => !origin.startsWith("https://"))) {
    configErrors.push("CLIENT_ORIGIN must use HTTPS in production");
  }
  configErrors.push(...configWarnings);
} else {
  configWarnings.forEach((warning) => console.warn(`Config warning: ${warning}`));
}

if (configErrors.length) {
  console.error(`Configuration error:\n- ${configErrors.join("\n- ")}`);
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => console.log(`Meeting Records API is running at http://localhost:${port}`));
  })
  .catch((error) => {
    console.error("Database connection failed", error);
    process.exit(1);
  });
