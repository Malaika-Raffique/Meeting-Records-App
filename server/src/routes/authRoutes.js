import { Router } from "express";
import { getCurrentUser, login, logout, refreshSession } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.post("/login", login);
router.post("/refresh", refreshSession);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getCurrentUser);

export default router;
