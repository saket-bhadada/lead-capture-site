const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include", // required for the admin_token cookie to be sent/set cross-origin
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
  submitLead: (payload) =>
    request("/api/leads", { method: "POST", body: JSON.stringify(payload) }),

  login: (password) =>
    request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) }),

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
};
