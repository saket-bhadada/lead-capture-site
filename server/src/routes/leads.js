import { Router } from "express";
import crypto from "node:crypto";
import { insertLead, getLeadById, getLeads, updateLeadStatus } from "../db.js";
import { leadSchema, statusUpdateSchema, STATUSES } from "shared/leadSchema.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// POST /api/leads - public submission endpoint
router.post("/", async (req, res) => {
  // Honeypot: real visitors never fill this field in. Bots that fill every
  // field usually do. Pretend success so the bot doesn't learn anything.
  if (req.body?.company) {
    return res.status(201).json({ ok: true });
  }

  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
  }

  const { name, email, budget_range, message } = parsed.data;
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();

  const leadData = { id, name, email, budget_range, message, status: "New", created_at };

  try {
    const lead = await insertLead(leadData);
    res.status(201).json(lead);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert lead" });
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