import { Router } from "express";
import jwt from "jsonwebtoken";
import authRoutes from "./auth.routes.js";
import oauthRoutes from "./oauth.route.js";
import userRoutes from "./user.routes.js";
import memoryRoutes from "./memory.routes.js";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = Router();

router.get("/socket-token", requireAuth, (req, res) =>
  res.json({ token: jwt.sign({ id: req.userId }, env.JWT_SECRET, { expiresIn: "5m" }) })
);

router.use("/", authRoutes);
router.use("/auth", oauthRoutes);
router.use("/me", userRoutes);
router.use("/memories", memoryRoutes);

export default router;