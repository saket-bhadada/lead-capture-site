import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { insertLead, getLeadById, getLeads, getClientLeads, updateLeadStatus } from "../db.js";
import { leadSchema, statusUpdateSchema } from "shared/leadSchema.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { requireClient } from "../middleware/requireClient.js";

const router = Router();

// POST /api/leads - submission endpoint (public or attached to client)
router.post("/", async (req, res) => {
  if (req.body?.company) {
    return res.status(201).json({ ok: true });
  }

  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  // Check if client is logged in
  let clientId = null;
  const clientToken = req.cookies?.client_token;
  if (clientToken) {
    try {
      const payload = jwt.verify(clientToken, process.env.JWT_SECRET);
      if (payload.role === "client") {
        clientId = payload.client_id;
      }
    } catch {
      // Ignore token error for public submission
    }
  }

  const { name, email, budget_range, message } = parsed.data;
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const leadData = {
    id,
    name,
    email,
    budget_range,
    message,
    status: "New",
    created_at,
    ...(clientId ? { client_id: clientId } : {}),
  };

  try {
    const lead = await insertLead(leadData);
    res.status(201).json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert lead" });
  }
});

// GET /api/leads/my-leads - client only, get submissions for current client
router.get("/my-leads", requireClient, async (req, res) => {
  try {
    const leads = await getClientLeads(req.user.id);
    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve client leads" });
  }
});

// GET /api/leads - admin only, supports ?search= and ?status=
router.get("/", requireAdmin, async (req, res) => {
  const { search, status } = req.query;
  try {
    const leads = await getLeads({ search, status });
    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to retrieve leads" });
  }
});

// PATCH /api/leads/:id - admin only, updates status
router.patch("/:id", requireAdmin, async (req, res) => {
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  try {
    const existing = await getLeadById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const updated = await updateLeadStatus(req.params.id, parsed.data.status);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update lead status" });
  }
});

export default router;