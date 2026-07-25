import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { STATUSES } from "shared/leadSchema.js";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const debounceRef = useRef(null);

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
    fetchLeads({ search, status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

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
      setLeads(prev);
      setErrorMsg("Couldn't update status. Try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search leads by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses ({leads.length})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMsg && <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>}

      {/* Compact Dense Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-medium text-slate-500">Loading leads database...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center text-xs font-medium text-slate-500">
            {search || statusFilter ? "No leads match your active search filters." : "No platform leads recorded yet."}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Budget</th>
                <th className="px-5 py-3.5">Message Inquiry</th>
                <th className="px-5 py-3.5">Date Submitted</th>
                <th className="px-5 py-3.5 text-right">Status Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} onStatusChange={onStatusChange} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function LeadRow({ lead, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = lead.message.length > 70;
  const shown = isLong && !expanded ? `${lead.message.slice(0, 70)}...` : lead.message;

  return (
    <tr className="hover:bg-slate-50/80 transition">
      <td className="px-5 py-4 font-bold text-slate-900">{lead.name}</td>
      <td className="px-5 py-4 text-slate-600 font-mono text-[11px]">{lead.email}</td>
      <td className="px-5 py-4 text-slate-700">
        <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-[11px]">
          {lead.budget_range}
        </span>
      </td>
      <td className="max-w-md px-5 py-4 text-slate-600 leading-normal">
        {shown}
        {isLong && (
          <button onClick={() => setExpanded((v) => !v)} className="ml-1 text-indigo-600 font-semibold underline">
            {expanded ? "less" : "more"}
          </button>
        )}
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-slate-400 font-mono text-[11px]">
        {new Date(lead.created_at).toLocaleDateString()}
      </td>
      <td className="px-5 py-4 text-right">
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
          className={`rounded-full border px-3 py-1 text-[11px] font-bold outline-none cursor-pointer ${statusStyles(
            lead.status
          )}`}
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
      return "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100";
    case "Contacted":
      return "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100";
    case "Closed":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
    default:
      return "border-slate-300 bg-slate-50 text-slate-600";
  }
}
