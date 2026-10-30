import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { env } from "../config/env.js";
import { setAuthCookie, clearAuthCookie } from "../utils/cookies.js";
import { normalizeEmail } from "../utils/email.js";
import { sendOtp, checkOtp, otpErrorMsg } from "../services/otp.service.js";

export async function signup(req, res) {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

if (!name || !email) {
  return res.status(400).json({ error: "Name and email are required." });
}
if (password.length < 8) {
  return res.status(400).json({ error: "Password must be at least 8 characters." });
}
if (Buffer.byteLength(password, "utf8") > 72) {
  return res.status(400).json({ error: "Password is too long (max 72 bytes, about 72 characters)." });
}


  try {
   const existing = await pool.query(
  "SELECT id, email_verified, password_hash FROM users WHERE email=$1",
  [email]
);
const hash = await bcrypt.hash(password, 10);

if (existing.rows.length) {
  const row = existing.rows[0];
  if (row.email_verified) {
    return res.status(400).json({
      error: row.password_hash
        ? "An account with this email already exists. Please sign in."
        : 'This email is registered with Google. Use "Continue with Google", or use Forgot password to add a password.',
    });
  }
  await pool.query("UPDATE users SET name=$1, password_hash=$2 WHERE id=$3", [
    name,
    hash,
    row.id,
  ]);
    } else {
      await pool.query(
        "INSERT INTO users (name, email, password_hash, email_verified) VALUES ($1,$2,$3,FALSE)",
        [name, email, hash]
      );
    }

    await sendOtp(email, "verify");
    res.status(201).json({ needsVerification: true, email });
  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ error: "User already exists" });
    throw err;
  }
}

export async function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

  const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  const user = result.rows[0];

  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (!user.password_hash) {
    return res
      .status(401)
      .json({ error: "This account uses Google login. Please use the Google button." });
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.email_verified) {
    await sendOtp(email, "verify");
    return res.status(403).json({
      error: "Please verify your email first.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  setAuthCookie(res, user.id);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    photo_url: user.photo_url,
    dob: user.dob,
  });
}

export function logout(req, res) {
  clearAuthCookie(res);
  res.json({ success: true });
}

export async function verifyEmail(req, res) {
  const email = normalizeEmail(req.body.email);
  const code = String(req.body.code || "").trim();

  const result = await checkOtp(email, "verify", code);
  if (result !== "ok") return res.status(400).json({ error: otpErrorMsg[result] });

  const upd = await pool.query("UPDATE users SET email_verified=TRUE WHERE email=$1 RETURNING id", [
    email,
  ]);
  if (!upd.rows.length) return res.status(400).json({ error: "Account not found." });

  setAuthCookie(res, upd.rows[0].id);
  res.json({ success: true });
}

export async function resendVerification(req, res) {
  const email = normalizeEmail(req.body.email);
  try {
    const q = await pool.query("SELECT email_verified FROM users WHERE email=$1", [email]);
    if (q.rows.length && !q.rows[0].email_verified) await sendOtp(email, "verify");
  } catch (err) {
    console.error("RESEND VERIFICATION ERROR:", err);
  }
  res.json({ message: "If the account is awaiting verification, a new code has been sent." });
}

export function googleCallback(req, res) {
  setAuthCookie(res, req.user.id);
  res.redirect(`${env.FRONTEND_URL}/memory`);
}
