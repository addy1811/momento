import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { normalizeEmail } from "../utils/email.js";
import { sendOtp, checkOtp, otpErrorMsg } from "../services/otp.service.js";

export async function forgotPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  try {
    const q = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (q.rows.length) await sendOtp(email, "reset");
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
  }
  // Same response whether or not the email exists
  res.json({ message: "If that email is registered, a code has been sent." });
}

export async function resetPassword(req, res) {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || "").trim();
  const password = String(req.body.password || "");

  if (password.length < 8) {
  return res.status(400).json({ error: "Password must be at least 8 characters." });
}
if (Buffer.byteLength(password, "utf8") > 72) {
  return res.status(400).json({ error: "Password is too long (max 72 bytes, about 72 characters)." });
}

  const result = await checkOtp(email, "reset", code);
  if (result !== "ok") return res.status(400).json({ error: otpErrorMsg[result] });

  const hash = await bcrypt.hash(password, 10);
  await pool.query("UPDATE users SET password_hash=$1, email_verified=TRUE WHERE email=$2", [
    hash,
    email,
  ]);
  res.json({ success: true });
}
