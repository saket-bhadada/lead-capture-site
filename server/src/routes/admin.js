import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 8, // 8 hours
};

router.post("/login", (req, res) => {
  const { password } = req.body ?? {};

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

  res.cookie("admin_token", token, COOKIE_OPTIONS);
  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", { ...COOKIE_OPTIONS, maxAge: undefined });
  res.json({ ok: true });
});

router.get("/session", (req, res) => {
  const token = req.cookies?.admin_token;
  if (!token) return res.json({ authenticated: false });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ authenticated: true });
  } catch {
    res.json({ authenticated: false });
  }
});

export default router;
