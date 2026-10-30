import { Router } from "express";
import passport from "../config/passport.js";
import { env } from "../config/env.js";
import { googleCallback } from "../controllers/auth.controller.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${env.FRONTEND_URL}/login`,
    session: false,
  }),
  googleCallback
);

export default router;
