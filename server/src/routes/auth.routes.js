import { Router } from "express";
import {
  signup,
  login,
  logout,
  verifyEmail,
  resendVerification,
} from "../controllers/auth.controller.js";
import { forgotPassword, resetPassword } from "../controllers/password.controller.js";
import { loginLimiter, emailLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/signup", emailLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

router.post("/verify-email", loginLimiter, verifyEmail);
router.post("/resend-verification", emailLimiter, resendVerification);

router.post("/forgot-password", emailLimiter, forgotPassword);
router.post("/reset-password", loginLimiter, resetPassword);

export default router;