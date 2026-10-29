import { env } from "../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const allowedOrigin = env.FRONTEND_URL.replace(/\/+$/, "");

export function originCheck(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get("origin");

  if (!origin) return next();

  if (origin !== allowedOrigin) {
    return res.status(403).json({ error: "Forbidden origin" });
  }
  next();
}