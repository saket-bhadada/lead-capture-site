import jwt from "jsonwebtoken";
import { getSessionById } from "../db.js";

export async function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // 1. Verify JWT signature and expiry
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 2. Verify session still exists in DB (not revoked via logout)
    const session = await getSessionById(payload.session_id);
    if (!session) {
      return res.status(401).json({ error: "Session has been revoked" });
    }

    // 3. Attach user info to the request
    req.user = {
      admin_id: payload.admin_id,
      session_id: payload.session_id,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
