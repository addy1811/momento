import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const baseOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? "none" : "lax",
};

export function setAuthCookie(res, userId) {
  const token = jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { ...baseOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookie(res) {
  res.clearCookie("token", baseOptions);
}
