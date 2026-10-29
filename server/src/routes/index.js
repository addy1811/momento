import { Router } from "express";
import authRoutes from "./auth.routes.js";
import oauthRoutes from "./oauth.route.js";
import userRoutes from "./user.routes.js";
import memoryRoutes from "./memory.routes.js";

const router = Router();

router.use("/", authRoutes);         
router.use("/auth", oauthRoutes);    
router.use("/me", userRoutes);        
router.use("/memories", memoryRoutes);

export default router;
