import { Router } from "express";
import { createEmployee, listEmployees, updateEmployeeStatus } from "../controllers/userController.js";
import { requireAuth, requireOperationsManager } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireOperationsManager);
router.get("/", listEmployees);
router.post("/", createEmployee);
router.patch("/:userId/status", updateEmployeeStatus);

export default router;
