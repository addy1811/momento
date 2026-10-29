import crypto from "crypto";
import pool from "../config/db.js";
import { env } from "../config/env.js";
import { sendOtpEmail } from "./mail.service.js";

const OTP_TTL_MIN = 10;
const OTP_COOLDOWN_SEC = 60;
const OTP_MAX_ATTEMPTS = 5;

export const otpErrorMsg = {
  invalid: "Incorrect code.",
  expired: "Code expired or not found. Please request a new one.",
  locked: "Too many wrong attempts. Please request a new code.",
};

const hashOtp = (email, purpose, code) =>
  crypto.createHmac("sha256", env.OTP_SECRET).update(`${email}:${purpose}:${code}`).digest("hex");

export async function sendOtp(email, purpose) {
  const prev = await pool.query(
    "SELECT last_sent_at FROM email_otps WHERE email=$1 AND purpose=$2",
    [email, purpose]
  );
  if (
    prev.rows.length &&
    Date.now() - new Date(prev.rows[0].last_sent_at).getTime() < OTP_COOLDOWN_SEC * 1000
  ) {
    return;
  }

  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  await pool.query(
    `INSERT INTO email_otps (email, purpose, code_hash, expires_at, attempts, last_sent_at)
     VALUES ($1, $2, $3, NOW() + make_interval(mins => $4), 0, NOW())
     ON CONFLICT (email, purpose) DO UPDATE
     SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at,
         attempts = 0, last_sent_at = NOW()`,
    [email, purpose, hashOtp(email, purpose, code), OTP_TTL_MIN]
  );
  await sendOtpEmail(email, purpose, code, OTP_TTL_MIN);
}

export async function checkOtp(email, purpose, code) {
  const q = await pool.query(
    "SELECT code_hash, expires_at, attempts FROM email_otps WHERE email=$1 AND purpose=$2",
    [email, purpose]
  );
  const row = q.rows[0];
  if (!row || new Date(row.expires_at) < new Date()) return "expired";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "locked";

  const expected = Buffer.from(row.code_hash);
  const actual = Buffer.from(hashOtp(email, purpose, String(code)));
  if (!crypto.timingSafeEqual(expected, actual)) {
    await pool.query(
      "UPDATE email_otps SET attempts = attempts + 1 WHERE email=$1 AND purpose=$2",
      [email, purpose]
    );
    return "invalid";
  }

  await pool.query("DELETE FROM email_otps WHERE email=$1 AND purpose=$2", [email, purpose]);
  return "ok";
}
