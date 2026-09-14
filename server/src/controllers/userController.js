import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isOperationsManagerEmail } from "../utils/operationsManager.js";

export const listEmployees = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ fullName: 1 });
  res.json({
    success: true,
    data: { users: users.map((user) => user.toSafeObject()) },
  });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const fullName = String(req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!fullName || !email || !password) {
    throw new ApiError(400, "Name, company email, and a temporary password are required");
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new ApiError(400, "Enter a valid email address");
  if (isOperationsManagerEmail(email)) {
    throw new ApiError(400, "That email is reserved for the Operations Manager account");
  }
  if (password.length < 8) throw new ApiError(400, "Temporary password must be at least 8 characters");

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(409, "An account with this email already exists");

  const employee = await User.create({ fullName, email, password, role: "employee" });
  res.status(201).json({ success: true, data: { user: employee.toSafeObject() } });
});

export const updateEmployeeStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") throw new ApiError(400, "isActive must be true or false");
  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot disable your own Operations Manager account");
  }

  const employee = await User.findOneAndUpdate(
    { _id: userId, role: "employee" },
    { isActive },
    { new: true, runValidators: true },
  );
  if (!employee) throw new ApiError(404, "Employee not found");
  res.json({ success: true, data: { user: employee.toSafeObject() } });
});
