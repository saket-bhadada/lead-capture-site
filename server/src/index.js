import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️  JWT_SECRET not set — copy server/.env.example to server/.env and fill it in."
  );
}

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

try {
  const { default: leadsRouter } = await import("./routes/leads.js");
  const { default: adminRouter } = await import("./routes/admin.js");
  const { seedAdmin, ensureTables, deleteExpiredSessions } = await import("./db.js");

  app.use("/api/leads", leadsRouter);
  app.use("/api/admin", adminRouter);

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // Serve frontend in production
  if (process.env.NODE_ENV === "production") {
    const clientDist = path.resolve(__dirname, "../../client/dist");
    app.use(express.static(clientDist));
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  // Auto-create tables (if supported by Supabase instance), cleanup, and seed admin
  await ensureTables();
  deleteExpiredSessions();
  seedAdmin();

} catch (error) {
  console.error("Startup Error:", error.message);
  process.exit(1);
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
