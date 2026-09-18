import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

export const createCsrfToken = () => crypto.randomBytes(32).toString("hex");

export const setCsrfCookie = (res) => {
  const token = createCsrfToken();
  res.cookie("csrfToken", token, csrfCookieOptions);
  res.setHeader("X-CSRF-Token", token);
  return token;
};

export const clearAuthCookies = (res) => {
  res.removeHeader("X-CSRF-Token");
  return res
    .clearCookie("accessToken", authCookieOptions)
    .clearCookie("refreshToken", authCookieOptions)
    .clearCookie("csrfToken", csrfCookieOptions);
};
