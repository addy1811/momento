import { env } from "../config/env.js";

export async function sendOtpEmail(to, purpose, code, ttlMinutes) {
  if (!env.BREVO_API_KEY) {
    if (env.isProd) throw new Error("Email is not configured");
    console.log(`[DEV] ${purpose} OTP for ${to}: ${code}`);
    return;
  }

  const isVerify = purpose === "verify";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Momento", email: env.MAIL_FROM },
      to: [{ email: to }],
      subject: isVerify ? "Verify your Momento email" : "Your Momento password reset code",
      textContent: `Your code is ${code}. It expires in ${ttlMinutes} minutes. If you didn't request this, ignore this email.`,
      htmlContent: `<p>${
        isVerify
          ? "Welcome to Momento! Use this code to verify your email:"
          : "Use this code to reset your Momento password:"
      }</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
      <p>It expires in ${ttlMinutes} minutes. If you didn't request this, ignore this email.</p>`,
    }),
  });

  if (!res.ok) throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
}