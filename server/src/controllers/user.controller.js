import pool from "../config/db.js";
import { uploadImage } from "../services/cloudinary.service.js";
export async function getMe(req, res) {
  const q = await pool.query("SELECT id, name, email, photo_url, dob FROM users WHERE id=$1", [
    req.userId,
  ]);
  if (!q.rows.length) return res.status(401).json({ error: "User not found" });
  res.json(q.rows[0]);
}

export async function updateProfile(req, res) {
  const { dob } = req.body;

  let photoUrl = null;
  if (req.file) {
    const uploaded = await uploadImage(req.file.buffer, "avatars");
    photoUrl = uploaded.url;
  }

  await pool.query("UPDATE users SET dob=$1, photo_url=COALESCE($2, photo_url) WHERE id=$3", [
    dob || null,
    photoUrl,
    req.userId,
  ]);
  res.json({ success: true });
}
