import { createClient } from "@supabase/supabase-js";


const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "[Supabase] SUPABASE_URL or SUPABASE_SECRET_KEY / SUPABASE_PUBLISHABLE_KEY not set in .env"
  );
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/** Helper functions mirroring old SQLite API */
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

// Optional: create leads table if it does not exist (requires Supabase SQL API access)
export async function ensureLeadsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      budget_range TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Closed')),
      created_at TIMESTAMP NOT NULL DEFAULT now()
    );`;
  try {
    await supabase.rpc("sql", { query: createTableSQL });
  } catch (e) {
    console.warn("[Supabase] Table creation skipped or failed:", e.message);
  }
}

// Initialize on startup
ensureLeadsTable();
