import jwt from "jsonwebtoken";

export async function requireClient(req, res, next) {
  const token = req.cookies?.client_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "client") {
      return res.status(403).json({ error: "Access denied: Client role required" });
    }

    req.user = {
      id: payload.client_id,
      email: payload.email,
      name: payload.name,
      role: "client",
    };

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
