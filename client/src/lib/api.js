const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || "Request failed");
    error.status = res.status;
    error.fieldErrors = data.errors;
    throw error;
  }

  return data;
}

export const api = {
  // Public Lead Submission
  submitLead: (payload) =>
    request("/api/leads", { method: "POST", body: JSON.stringify(payload) }),

  // Client Auth & Portal APIs
  clientLogin: (email, password) =>
    request("/api/client/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  clientSignup: (name, email, password) =>
    request("/api/client/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }),

  clientLogout: () => request("/api/client/logout", { method: "POST" }),

  clientSession: () => request("/api/client/session"),

  getMyLeads: () => request("/api/leads/my-leads"),

  // Admin Auth & Management APIs
  login: (username, password) =>
    request("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }),

  signup: (username, password) =>
    request("/api/admin/signup", { method: "POST", body: JSON.stringify({ username, password }) }),

  logout: () => request("/api/admin/logout", { method: "POST" }),

  session: () => request("/api/admin/session"),

  getLeads: ({ search, status } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const qs = params.toString();
    return request(`/api/leads${qs ? `?${qs}` : ""}`);
  },

  updateStatus: (id, status) =>
    request(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),

  checkHealth: () => request("/api/health"),
};
