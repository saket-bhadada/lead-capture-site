import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

let supabase = null;
let configError = null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  configError =
    "SUPABASE_URL or SUPABASE_SECRET_KEY / SUPABASE_PUBLISHABLE_KEY is not set. " +
    "Set these in your hosting platform's environment variables.";
  console.error(`[Supabase] ${configError}`);
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Every DB function calls this first. If Supabase isn't configured, this
// throws a clear per-request error instead of crashing the whole process
// at import time (which is what happened before this fix).
function requireSupabase() {
  if (!supabase) {
    const err = new Error(configError || "Supabase is not configured.");
    err.isConfigError = true;
    throw err;
  }
  return supabase;
}

// ─── Lead helpers ───────────────────────────────────────────────────────────

export async function insertLead(lead) {
  const db = requireSupabase();
  const { data, error } = await db.from("leads").insert(lead).select().single();
  if (error) throw error;
  return data;
}

export async function getLeadById(id) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLeads({ search, status } = {}) {
  const db = requireSupabase();
  let query = db.from("leads").select("*");
  if (search) {
    const term = `%${search}%`;
    query = query.or(`name.ilike.${term},email.ilike.${term},message.ilike.${term}`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateLeadStatus(id, status) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("leads")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Admin user helpers ─────────────────────────────────────────────────────

export async function getAdminByUsername(username) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_users")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function countAdmins() {
  const db = requireSupabase();
  const { count, error } = await db
    .from("admin_users")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count;
}

export async function insertAdmin({ id, username, email, password_hash }) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("admin_users")
    .insert({ id, username, email, password_hash })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Session helpers ────────────────────────────────────────────────────────

export async function insertSession({ id, admin_id, token, created_at, expires_at }) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("sessions")
    .insert({ id, admin_id, token, created_at, expires_at })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSessionById(id) {
  const db = requireSupabase();
  const { data, error } = await db
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function deleteSession(id) {
  const db = requireSupabase();
  const { error } = await db.from("sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteExpiredSessions() {
  if (!supabase) return; // nothing to clean up if not configured yet
  const { error } = await supabase
    .from("sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());
  if (error && error.code !== "PGRST205") {
    console.warn("[Supabase] Failed to clean expired sessions:", error.message);
  }
}

// ─── First-run admin seed ───────────────────────────────────────────────────
//
// NOTE: this does NOT create tables. Supabase does not expose a generic
// raw-SQL RPC by default, so auto-creating tables from application code
// isn't reliable. Run supabase-schema.sql in your Supabase project's SQL
// editor once, manually, before the first deploy. This function just seeds
// the first admin user once those tables already exist.

export async function ensureTables() {
  if (!supabase) return false;
  const { error } = await supabase.from("leads").select("id").limit(1);
  if (error && error.code === "PGRST205") {
    console.warn("");
    console.warn("\u26a0\ufe0f  Database tables not found.");
    console.warn(
      "   Run supabase-schema.sql in your Supabase project's SQL editor,"
    );
    console.warn("   then redeploy.");
    console.warn("");
    return false;
  }
  return true;
}

export async function seedAdmin() {
  try {
    const adminCount = await countAdmins();
    if (adminCount > 0) return; // admins already exist

    const plainPassword = crypto.randomBytes(12).toString("hex"); // 24 hex chars
    const password_hash = await bcrypt.hash(plainPassword, 10);
    const id = crypto.randomUUID();

    await insertAdmin({
      id,
      username: "admin",
      email: "",
      password_hash,
    });

    console.log("");
    console.log("\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510");
    console.log("\u2502  First Admin User Created                   \u2502");
    console.log(`\u2502  Username: admin                            \u2502`);
    console.log(`\u2502  Password: ${plainPassword}   \u2502`);
    console.log("\u2502  Change this immediately in /admin          \u2502");
    console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518");
    console.log("");
  } catch (e) {
    if (e.code === "PGRST205") {
      console.warn(
        "\u26a0\ufe0f  Database tables not found. Run supabase-schema.sql in your Supabase dashboard, then redeploy."
      );
    } else {
      console.warn("[Supabase] Admin seeding skipped or failed:", e.message);
    }
  }
}