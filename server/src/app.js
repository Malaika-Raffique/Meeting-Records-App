import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { requireCsrfToken } from "./middlewares/csrf.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/v1", requireCsrfToken);
app.use(
  "/api",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: "draft-8", legacyHeaders: false }),
);
app.use(
  "/api/v1/auth/login",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false }),
);

app.get("/api/v1/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
