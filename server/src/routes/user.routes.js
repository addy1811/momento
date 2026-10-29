import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { getMe, updateProfile } from "../controllers/user.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", getMe);
router.post("/profile", upload.single("photo"), updateProfile);

export default router;