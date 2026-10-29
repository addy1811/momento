import pool from "../config/db.js";

export async function findOrCreateOAuthUser({ provider, providerId, name, email, photoUrl }) {
  const existing = await pool.query(
    "SELECT u.* FROM users u JOIN oauth_accounts o ON u.id = o.user_id WHERE o.provider=$1 AND o.provider_id=$2",
    [provider, providerId]
  );
  if (existing.rows.length) return existing.rows[0];

  if (email) {
    const byEmail = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (byEmail.rows.length) {
      const user = byEmail.rows[0];
      await pool.query(
        `UPDATE users SET email_verified = TRUE,
           password_hash = CASE WHEN email_verified THEN password_hash ELSE NULL END
         WHERE id = $1`,
        [user.id]
      );
      await pool.query(
        "INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES ($1,$2,$3)",
        [user.id, provider, providerId]
      );
      return user;
    }
  }

  const inserted = await pool.query(
    "INSERT INTO users (name, email, photo_url, email_verified) VALUES ($1,$2,$3,TRUE) RETURNING *",
    [name, email || null, photoUrl || null]
  );
  const newUser = inserted.rows[0];
  await pool.query(
    "INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES ($1,$2,$3)",
    [newUser.id, provider, providerId]
  );
  return newUser;
}
