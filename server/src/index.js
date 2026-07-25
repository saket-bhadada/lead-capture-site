import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import leadsRouter from "./routes/leads.js";
import adminRouter from "./routes/admin.js";
import "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_SECRET || !process.env.ADMIN_PASSWORD) {
  console.warn(
    "\u26a0\ufe0f  JWT_SECRET or ADMIN_PASSWORD not set \u2014 copy server/.env.example to server/.env and fill them in."
  );
}

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/leads", leadsRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
