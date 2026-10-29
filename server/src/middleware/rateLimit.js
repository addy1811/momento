import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const common = { windowMs: 15 * 60 * 1000, standardHeaders: true, legacyHeaders: false };

export const apiLimiter = rateLimit({
  ...common,
  limit: env.isProd ? 300 : 5000,
  message: { error: "Too many requests. Please try again later." },
});

export const loginLimiter = rateLimit({
  ...common,
  limit: env.isProd ? 10 : 100,
  skipSuccessfulRequests: true,
  message: { error: "Too many attempts. Please try again later." },
});

export const emailLimiter = rateLimit({
  ...common,
  limit: env.isProd ? 5 : 100,
  message: { error: "Too many requests. Please try again later." },
});