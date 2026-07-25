import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  getClientByEmail,
  getClientById,
  insertClient,
} from "../db.js";

const router = Router();

const CLIENT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

// POST /api/client/signup — Client register
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    const existing = await getClientByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    const client = await insertClient({
      id,
      name,
      email: email.toLowerCase().trim(),
      password_hash,
    });

    const token = jwt.sign(
      { client_id: client.id, email: client.email, name: client.name, role: "client" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("client_token", token, CLIENT_COOKIE_OPTIONS);
    res.status(201).json({ ok: true, client: { id: client.id, name: client.name, email: client.email } });
  } catch (err) {
    console.error("[Client Signup Error]", err);
    res.status(500).json({ error: "Failed to create client account" });
  }
});

// POST /api/client/login — Client login
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const client = await getClientByEmail(email.toLowerCase().trim());
    if (!client) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, client.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { client_id: client.id, email: client.email, name: client.name, role: "client" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("client_token", token, CLIENT_COOKIE_OPTIONS);
    res.json({ ok: true, client: { id: client.id, name: client.name, email: client.email } });
  } catch (err) {
    console.error("[Client Login Error]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/client/logout
router.post("/logout", (req, res) => {
  res.clearCookie("client_token", { ...CLIENT_COOKIE_OPTIONS, maxAge: undefined });
  res.json({ ok: true });
});

// GET /api/client/session
router.get("/session", async (req, res) => {
  const token = req.cookies?.client_token;
  if (!token) return res.json({ authenticated: false });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "client") {
      return res.json({ authenticated: false });
    }

    const client = await getClientById(payload.client_id);
    if (!client) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      client: { id: client.id, name: client.name, email: client.email },
    });
  } catch {
    res.json({ authenticated: false });
  }
});

export default router;
