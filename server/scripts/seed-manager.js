import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../src/models/User.js";
import { getOperationsManagerEmail } from "../src/utils/operationsManager.js";

const required = ["MONGO_URI", "SEED_MANAGER_NAME", "SEED_MANAGER_PASSWORD"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);

try {
  const approvedEmail = getOperationsManagerEmail();
  const email = String(process.env.SEED_MANAGER_EMAIL || approvedEmail).trim().toLowerCase();
  if (email !== approvedEmail) {
    console.error(`SEED_MANAGER_EMAIL must match the approved Operations Manager email: ${approvedEmail}`);
    process.exitCode = 1;
  } else {
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== "operations_manager") {
        console.error("The approved Operations Manager email already exists, but it is not an Operations Manager account.");
        process.exitCode = 1;
      } else if (!existing.isActive) {
        console.error("The approved Operations Manager account exists, but it is disabled.");
        process.exitCode = 1;
      } else {
        console.log("Operations Manager account already exists; no changes made.");
      }
    } else {
      await User.create({
        fullName: process.env.SEED_MANAGER_NAME.trim(),
        email,
        password: process.env.SEED_MANAGER_PASSWORD,
        role: "operations_manager",
      });
      console.log("Operations Manager account created.");
    }
  }
} finally {
  await mongoose.disconnect();
}
