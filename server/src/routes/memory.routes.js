import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import {
  listMemories,
  createMemory,
  updateMemoryLocation,
  deleteMemory,
} from "../controllers/memory.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", listMemories);
router.post("/", upload.single("image"), createMemory);
router.patch("/:id/location", updateMemoryLocation);
router.delete("/:id", deleteMemory);

export default router;