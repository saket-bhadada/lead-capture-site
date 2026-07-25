import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "SUPABASE_URL or SUPABASE_SECRET_KEY / SUPABASE_PUBLISHABLE_KEY not set. " +
    "Set these in your hosting platform's environment variables."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Lead helpers ───────────────────────────────────────────────────────────

export async function insertLead(lead) {
  const { data, error } = await supabase.from("leads").insert(lead).single();
  if (error) throw error;
  return data;
}

export async function getLeadById(id) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getLeads({ search, status } = {}) {
  let query = supabase.from("leads").select("*");
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
  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ─── Admin user helpers ─────────────────────────────────────────────────────

export async function getAdminByUsername(username) {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("username", username)
    .single();
  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data ?? null;
}

export async function countAdmins() {
  const { count, error } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true });
  if (error) throw error;
  return count;
}

export async function insertAdmin({ id, username, email, password_hash }) {
  const { data, error } = await supabase
    .from("admin_users")
    .insert({ id, username, email, password_hash })
    .single();
  if (error) throw error;
  return data;
}

// ─── Session helpers ────────────────────────────────────────────────────────

export async function insertSession({ id, admin_id, token, created_at, expires_at }) {
  const { data, error } = await supabase
    .from("sessions")
    .insert({ id, admin_id, token, created_at, expires_at })
    .single();
  if (error) throw error;
  return data;
}

export async function getSessionById(id) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ?? null;
}

export async function deleteSession(id) {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteExpiredSessions() {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .lt("expires_at", new Date().toISOString());
  if (error) console.warn("[Supabase] Failed to clean expired sessions:", error.message);
}

// ─── First-run admin seed ───────────────────────────────────────────────────

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
    console.log("┌─────────────────────────────────────────────┐");
    console.log("│  First Admin User Created                   │");
    console.log(`│  Username: admin                            │`);
    console.log(`│  Password: ${plainPassword}   │`);
    console.log("│  Change this immediately in /admin          │");
    console.log("└─────────────────────────────────────────────┘");
    console.log("");
  } catch (e) {
    console.warn("[Supabase] Admin seeding skipped or failed:", e.message);
  }
}

// Clean up expired sessions on startup
deleteExpiredSessions();
