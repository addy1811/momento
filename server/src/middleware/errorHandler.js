import { env } from "../config/env.js";

export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
 const status = err.code === "LIMIT_FILE_SIZE" ? 400 : err.status || err.statusCode || 500;
  res.status(status).json({
    error: env.isProd && status === 500 ? "Internal server error" : err.message,
  });
}