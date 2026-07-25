import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import leadsRouter from "./routes/leads.js";
import adminRouter from "./routes/admin.js";
import { seedAdmin, ensureTables, deleteExpiredSessions } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_SECRET) {
  console.warn(
    "\u26a0\ufe0f  JWT_SECRET not set \u2014 copy server/.env.example to server/.env and fill it in."
  );
}

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/leads", leadsRouter);
app.use("/api/admin", adminRouter);
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the React app in production. This is registered unconditionally,
// outside of any database setup — a Supabase problem should never take
// down the ability to load the site itself.
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Database setup runs AFTER the server is already listening and serving
// pages. If Supabase isn't configured yet, this logs a clear, loud warning
// but never kills the process — the site stays up, and only the DB-backed
// routes (lead submission, admin login) will 500 until this is fixed.
(async () => {
  try {
    await ensureTables();
    await deleteExpiredSessions();
    await seedAdmin();
  } catch (error) {
    console.error("");
    console.error("\u2717 Database initialization failed:", error.message);
    console.error(
      "  The server is still running and the site will load, but lead"
    );
    console.error(
      "  submission and admin login will not work until this is fixed."
    );
    console.error(
      "  Run supabase-schema.sql in your Supabase project's SQL editor,"
    );
    console.error(
      "  and confirm SUPABASE_URL / SUPABASE_SECRET_KEY are set correctly."
    );
    console.error("");
  }
})();

export default app;