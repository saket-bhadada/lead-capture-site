import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  getAdminByUsername,
  insertAdmin,
  insertSession,
  deleteSession,
  getSessionById,
} from "../db.js";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 8, // 8 hours
};

// POST /api/admin/login — authenticate with username + password
router.post("/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    // 1. Look up admin by username
    const admin = await getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // 2. Compare password hash
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // 3. Create a session record
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 8); // 8 hours

    const token = jwt.sign(
      { admin_id: admin.id, session_id: sessionId },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await insertSession({
      id: sessionId,
      admin_id: admin.id,
      token,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    // 4. Set httpOnly cookie and respond
    res.cookie("admin_token", token, COOKIE_OPTIONS);
    res.json({ ok: true });
  } catch (err) {
    console.error("[Admin Login Error]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/logout — revoke session
router.post("/logout", async (req, res) => {
  const token = req.cookies?.admin_token;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.session_id) {
        await deleteSession(payload.session_id);
      }
    } catch {
      // Token invalid or expired — still clear the cookie
    }
  }

  res.clearCookie("admin_token", { ...COOKIE_OPTIONS, maxAge: undefined });
  res.json({ ok: true });
});

// GET /api/admin/session — check if current session is valid
router.get("/session", async (req, res) => {
  const token = req.cookies?.admin_token;
  if (!token) return res.json({ authenticated: false });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Also verify session still exists in DB (not revoked)
    const session = await getSessionById(payload.session_id);
    if (!session) {
      return res.json({ authenticated: false });
    }

    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

// POST /api/admin/signup — create a new admin user
router.post("/signup", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const existingAdmin = await getAdminByUsername(username);
    if (existingAdmin) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await insertAdmin({
      id,
      username,
      email: "", // email not used currently
      password_hash,
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("[Admin Signup Error]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
