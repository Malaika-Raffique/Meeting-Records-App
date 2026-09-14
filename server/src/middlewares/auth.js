import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isOperationsManagerAccount } from "../utils/operationsManager.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken || req.get("Authorization")?.replace("Bearer ", "");

  if (!token) throw new ApiError(401, "Please sign in to continue");

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) throw new ApiError(401, "Your account is unavailable");
    req.user = user;
    req.auth = {
      canManageOperations: isOperationsManagerAccount(user),
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
});

export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, "You do not have permission to perform this action"));
  }
  if (req.user.role === "operations_manager" && !req.auth?.canManageOperations) {
    return next(new ApiError(403, "Only the approved Operations Manager account can perform this action"));
  }
  next();
};

export const requireOperationsManager = (req, res, next) => {
  if (!req.auth?.canManageOperations) {
    return next(new ApiError(403, "Only the approved Operations Manager account can perform this action"));
  }
  next();
};
