import express from "express";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
 
dotenv.config();
 
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL  = process.env.BACKEND_URL  || "http://localhost:4000";
const PORT         = process.env.PORT          || 4000;
const SECRET       = process.env.JWT_SECRET    || "fallback_secret_for_dev_only";
const isProd       = process.env.NODE_ENV === "production";
 
/* ------------------ APP + SERVER ------------------ */
 
const app = express();
const httpServer = createServer(app);
 
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, credentials: true }
});
 
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
 
app.use(session({
  secret: process.env.SESSION_SECRET || "oauth_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,      
    maxAge: 10 * 60 * 1000
  }
}));
 
app.use(passport.initialize());
app.use(passport.session());
 
/* ------------------ DB ------------------ */
 
const pool = process.env.DATABASE_URL
  ? new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }  
    })
  : new pg.Pool({
      user:     process.env.DB_USER    
      host:     process.env.DB_HOST    
      database: process.env.DB_NAME     
      password: process.env.DB_PASSWORD 
      port:     Number(process.env.DB_PORT) 
    });
 
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
 
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "memories",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "gif"]
  }
});
 
const upload = multer({ storage });
 
async function findOrCreateOAuthUser({ provider, providerId, name, email, photoUrl }) {
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
        "INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES ($1,$2,$3)",
        [user.id, provider, providerId]
      );
      return user;
    }
  }
 
  const inserted = await pool.query(
    "INSERT INTO users (name, email, photo_url) VALUES ($1,$2,$3) RETURNING *",
    [name, email || null, photoUrl || null]
  );
  const newUser = inserted.rows[0];
  await pool.query(
    "INSERT INTO oauth_accounts (user_id, provider, provider_id) VALUES ($1,$2,$3)",
    [newUser.id, provider, providerId]
  );
  return newUser;
}
 
function issueTokenAndRedirect(req, res, user) {
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,          
    sameSite: isProd ? "none" : "lax",   
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.redirect(`${FRONTEND_URL}/memory`);
}
 
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
 
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  `${BACKEND_URL}/api/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await findOrCreateOAuthUser({
        provider:  "google",
        providerId: profile.id,
        name:      profile.displayName,
        email:     profile.emails?.[0]?.value,
        photoUrl:  profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  }
));
 
 
app.get("/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get("/api/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: false
  }),
  (req, res) => issueTokenAndRedirect(req, res, req.user)
);
 
 
io.use((socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie;
    if (!cookie) return next(new Error("No cookie"));
    const token = cookie.split("; ").find(c => c.startsWith("token="))?.split("=")[1];
    if (!token) return next(new Error("No token"));
    const decoded = jwt.verify(token, SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});
 
io.on("connection", (socket) => {
  console.log(" Socket connected:", socket.userId);
  socket.on("disconnect", () => console.log(" Socket disconnected:", socket.userId));
});
 
 
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email, photo_url",
      [name, email, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(400).json({ error: "User already exists" });
  }
});
 
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  const user = result.rows[0];
 
  if (!user || !user.password_hash) {
    return res.status(401).json({ error: "This account uses Google login. Please use the Google button." });
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
 
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
  res.json({ id: user.id, name: user.name, email: user.email, photo_url: user.photo_url, dob: user.dob });
});
 
app.get("/api/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const { id } = jwt.verify(token, SECRET);
    const q = await pool.query("SELECT id, name, email, photo_url, dob FROM users WHERE id=$1", [id]);
    res.json(q.rows[0]);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});
 
app.post("/api/me/profile", upload.single("photo"), async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const { id } = jwt.verify(token, SECRET);
    const { dob } = req.body;
    const photoUrl = req.file ? req.file.path : null;
    await pool.query(
      "UPDATE users SET dob=$1, photo_url=COALESCE($2, photo_url) WHERE id=$3",
      [dob || null, photoUrl, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("PROFILE UPDATE ERROR:", err);
    res.status(500).json({ error: "Profile update failed" });
  }
});
 
/* ------------------ MEMORIES ------------------ */
 
app.post("/api/memories", upload.single("image"), async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, SECRET);
    if (!req.file) return res.status(400).json({ error: "Image required" });
    const { country, description } = req.body;
    const result = await pool.query(
      "INSERT INTO memories (user_id, country, photo_url, description, public_id) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [decoded.id, country.trim(), req.file.path, description || null, req.file.filename]
    );
    io.emit("memory:created", result.rows[0]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Memory upload failed" });
  }
});
 
app.get("/api/memories", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token" });
  const { id: userId } = jwt.verify(token, SECRET);
  const result = await pool.query(
    "SELECT id, country, photo_url, description FROM memories WHERE user_id=$1",
    [userId]
  );
  res.json(result.rows);
});
 
app.delete("/api/memories/:id", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const { id: userId } = jwt.verify(token, SECRET);
    const memoryId = req.params.id;
    const result = await pool.query(
      "SELECT public_id FROM memories WHERE id=$1 AND user_id=$2",
      [memoryId, userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Memory not found" });
    await cloudinary.uploader.destroy(result.rows[0].public_id);
    await pool.query("DELETE FROM memories WHERE id=$1", [memoryId]);
    io.emit("memory:deleted", { id: memoryId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
});
 
app.post("/api/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax"
  });
  res.json({ success: true });
});
 
app.get("/health", (req, res) => res.json({ status: "ok" }));
 
/* ------------------ START ------------------ */
 
httpServer.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
