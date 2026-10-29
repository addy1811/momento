import pool from "../config/db.js";
import { uploadImage, deleteImage } from "../services/cloudinary.service.js";
import { emitToUser } from "../socket/index.js";

const COLUMNS =
  "id, country, photo_url, description, lat, lng, place_name, city, state, country_code, location_source";

const clean = (v, max = 120) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || null;
};

export function parseLocation(body) {
  const lat = body.lat === undefined || body.lat === "" ? NaN : Number(body.lat);
  const lng = body.lng === undefined || body.lng === "" ? NaN : Number(body.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const code = String(body.countryCode || "").trim();
  return {
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
    placeName: clean(body.placeName, 160),
    city: clean(body.city),
    state: clean(body.state),
    country: clean(body.country),
    countryCode: /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : null,
    source: ["search", "map", "photo", "browse", "browse_approx"].includes(body.locationSource) ? body.locationSource : null,
  };
}

export async function listMemories(req, res) {
  const result = await pool.query(`SELECT ${COLUMNS} FROM memories WHERE user_id=$1 ORDER BY id`, [req.userId]);
  res.json(result.rows);
}

export async function createMemory(req, res) {
  if (!req.file) return res.status(400).json({ error: "Image required" });

  const loc = parseLocation(req.body);
  if (loc.lat === null && !loc.country) {
    return res.status(400).json({ error: "Please choose where this memory was made." });
  }

  const { url, publicId } = await uploadImage(req.file.buffer, "memories");

  try {
    const result = await pool.query(
      `INSERT INTO memories
         (user_id, country, photo_url, description, public_id,
          lat, lng, place_name, city, state, country_code, location_source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING ${COLUMNS}, user_id`,
      [
        req.userId,
        loc.country || "Unknown",
        url,
        clean(req.body.description, 2000),
        publicId,
        loc.lat, loc.lng, loc.placeName, loc.city, loc.state, loc.countryCode, loc.source,
      ]
    );
    emitToUser(req.userId, "memory:created", result.rows[0]);
    res.json({ success: true });
  } catch (err) {
    await deleteImage(publicId).catch(() => {}); 
    throw err;
  }
}

export async function updateMemoryLocation(req, res) {
  const memoryId = Number(req.params.id);
  if (!Number.isInteger(memoryId)) return res.status(400).json({ error: "Invalid memory id" });

  const loc = parseLocation(req.body);
  if (loc.lat === null) return res.status(400).json({ error: "Valid coordinates are required." });

  const result = await pool.query(
    `UPDATE memories
        SET lat=$1, lng=$2, place_name=$3, city=$4, state=$5, country_code=$6,
            location_source=$7, country=COALESCE($8, country)
      WHERE id=$9 AND user_id=$10
      RETURNING ${COLUMNS}, user_id`,
    [loc.lat, loc.lng, loc.placeName, loc.city, loc.state, loc.countryCode, loc.source, loc.country, memoryId, req.userId]
  );
  if (!result.rows.length) return res.status(404).json({ error: "Memory not found" });

  emitToUser(req.userId, "memory:updated", result.rows[0]);
  res.json(result.rows[0]);
}

export async function deleteMemory(req, res) {
  const memoryId = Number(req.params.id);
  if (!Number.isInteger(memoryId)) return res.status(400).json({ error: "Invalid memory id" });

  const result = await pool.query("SELECT public_id FROM memories WHERE id=$1 AND user_id=$2", [memoryId, req.userId]);
  if (!result.rows.length) return res.status(404).json({ error: "Memory not found" });

  await deleteImage(result.rows[0].public_id);
  await pool.query("DELETE FROM memories WHERE id=$1 AND user_id=$2", [memoryId, req.userId]);
  emitToUser(req.userId, "memory:deleted", { id: memoryId });
  res.json({ success: true });
}
