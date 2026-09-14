import { ApiError } from "../utils/ApiError.js";

export const notFound = (req, res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || (error.name === "ValidationError" ? 400 : 500);
  const message =
    error.code === 11000
      ? "A record with that unique value already exists"
      : error.message || "Something went wrong";

  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
  });
};
