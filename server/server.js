import http from "http";
import app from "./src/app.js";
import pool from "./src/config/db.js";
import { env } from "./src/config/env.js";
import { initSocket } from "./src/socket/index.js";

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(env.PORT, async () => {
  console.log(`Server running on port ${env.PORT}`);
  try {
    await pool.query("SELECT 1");
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
});
