import pg from "pg";
import { env } from "./env.js";

const pool = env.DATABASE_URL
  ? new pg.Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, 
    })
  : new pg.Pool({
      user: env.DB_USER,
      host: env.DB_HOST,
      database: env.DB_NAME,
      password: env.DB_PASSWORD,
      port: env.DB_PORT,
    });

export default pool;
