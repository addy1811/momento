import { getUserIdFromToken } from "../utils/verifyToken.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.userId = getUserIdFromToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}