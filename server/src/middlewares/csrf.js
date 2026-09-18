import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";

import { setCsrfCookie } from "../utils/authCookies.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const csrfExemptRoutes = new Set(["/api/v1/auth/login", "/api/v1/auth/logout"]);

const sameToken = (left, right) => {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const requireCsrfToken = (req, res, next) => {
  let cookieToken = req.cookies?.csrfToken;

  if (safeMethods.has(req.method)) {
    if (!cookieToken) {
      setCsrfCookie(res);
    } else {
      res.setHeader("X-CSRF-Token", cookieToken);
    }
    return next();
  }

  if (csrfExemptRoutes.has(req.originalUrl.split("?")[0])) {
    return next();
  }

  const headerToken = req.get("x-csrf-token");

  if (!sameToken(cookieToken, headerToken)) {
    return next(new ApiError(403, "Security check failed. Refresh the page and try again."));
  }

  next();
};
