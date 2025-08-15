// server/routes/adminRoutes.js
import express from "express";
import { getAdminAnalytics } from "../controllers/adminController.js";
import { adminOnly, protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/analytics", protect, adminOnly, getAdminAnalytics);

export default router;
