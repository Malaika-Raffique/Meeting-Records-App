import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const csrfExemptRoutes = new Set(["/api/v1/auth/login"]);

const sameToken = (left, right) => {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const requireCsrfToken = (req, res, next) => {
  if (safeMethods.has(req.method) || csrfExemptRoutes.has(req.originalUrl.split("?")[0])) {
    return next();
  }

  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get("x-csrf-token");

  if (!sameToken(cookieToken, headerToken)) {
    return next(new ApiError(403, "Security check failed. Refresh the page and try again."));
  }

  next();
};
