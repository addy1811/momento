import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

function secret(name, devFallback) {
  const value = process.env[name];
  if (value) return value;
  if (isProd) throw new Error(`${name} must be set in production`);
  return devFallback;
}

const JWT_SECRET = secret("JWT_SECRET", "fallback_secret_for_dev_only");

export const env = {
  isProd,
  PORT: Number(process.env.PORT) || 4000,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  BACKEND_URL: process.env.BACKEND_URL || "http://localhost:4000",

  JWT_SECRET,
  OTP_SECRET: process.env.OTP_SECRET || JWT_SECRET,

  DATABASE_URL: process.env.DATABASE_URL,
  DB_USER: process.env.DB_USER || "postgres",
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_NAME: process.env.DB_NAME || "momento",
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_PORT: Number(process.env.DB_PORT) || 5432,

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

   BREVO_API_KEY: process.env.BREVO_API_KEY,
   MAIL_FROM: process.env.MAIL_FROM,
};
