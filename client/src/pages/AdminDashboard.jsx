import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { STATUSES } from "shared/leadSchema.js";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const debounceRef = useRef(null);

  useEffect(() => {
    api
      .session()
      .then((res) => {
        if (!res.authenticated) {
          navigate("/admin/login");
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => navigate("/admin/login"));
  }, [navigate]);

  const fetchLeads = useCallback(
    async (opts) => {
      setLoading(true);
      setErrorMsg("");
      try {
        const data = await api.getLeads(opts);
        setLeads(data);
      } catch (err) {
        if (err.status === 401) {
          navigate("/admin/login");
        } else {
          setErrorMsg("Couldn't load leads. Try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (checkingSession) return;
    fetchLeads({ search, status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, statusFilter]);

  const onSearchChange = (value) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLeads({ search: value, status: statusFilter });
    }, 300);
  };

  const onStatusChange = async (id, newStatus) => {
    const prev = leads;
    setLeads((current) => current.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    try {
      await api.updateStatus(id, newStatus);
    } catch {
      setLeads(prev); // roll back on failure
      setErrorMsg("Couldn't update status. Try again.");
    }
  };

  const onLogout = async () => {
    await api.logout();
    navigate("/admin/login");
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
          <button onClick={onLogout} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            Log out
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search by name, email, or message..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {errorMsg && <p className="mt-4 text-sm text-red-600">{errorMsg}</p>}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading...</div>
          ) : leads.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              {search || statusFilter ? "No leads match your search." : "No leads yet."}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Message</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <LeadRow key={lead.id} lead={lead} onStatusChange={onStatusChange} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadRow({ lead, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = lead.message.length > 60;
  const shown = isLong && !expanded ? `${lead.message.slice(0, 60)}...` : lead.message;

  return (
    <tr className="align-top">
      <td className="px-4 py-3 text-slate-900">{lead.name}</td>
      <td className="px-4 py-3 text-slate-600">{lead.email}</td>
      <td className="px-4 py-3 text-slate-600">{lead.budget_range}</td>
      <td className="max-w-xs px-4 py-3 text-slate-600">
        {shown}
        {isLong && (
          <button onClick={() => setExpanded((v) => !v)} className="ml-1 text-slate-400 underline">
            {expanded ? "less" : "more"}
          </button>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
        {new Date(lead.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles(lead.status)}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function statusStyles(status) {
  switch (status) {
    case "New":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Contacted":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Closed":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}
