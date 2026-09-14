import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authCookieOptions, clearAuthCookies, setCsrfCookie } from "../utils/authCookies.js";
import { isOperationsManagerAccount } from "../utils/operationsManager.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const issueSession = async (user, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  setCsrfCookie(res);
  return res
    .cookie("accessToken", accessToken, authCookieOptions)
    .cookie("refreshToken", refreshToken, authCookieOptions)
    .json({ success: true, data: { user: user.toSafeObject() } });
};

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive) throw new ApiError(403, "Your account has been disabled");
  if (user.role === "operations_manager" && !isOperationsManagerAccount(user)) {
    throw new ApiError(403, "This Operations Manager account is not approved for admin access");
  }

  return issueSession(user, res);
});

export const refreshSession = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) throw new ApiError(401, "Please sign in to continue");

  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.sub).select("+refreshToken");
    if (!user || !user.isActive || user.refreshToken !== hashToken(token)) {
      throw new ApiError(401, "Invalid refresh token");
    }
    return issueSession(user, res);
  } catch (error) {
    clearAuthCookies(res);
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
});

export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+refreshToken");
  if (user) {
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
  }
  clearAuthCookies(res).status(200).json({ success: true, message: "Signed out" });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user.toSafeObject() } });
});
