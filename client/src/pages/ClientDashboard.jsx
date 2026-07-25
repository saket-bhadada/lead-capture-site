import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import LeadForm from "../components/LeadForm.jsx";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    api
      .clientSession()
      .then((res) => {
        if (!res.authenticated) {
          navigate("/login");
        } else {
          setClient(res.client);
          setLoadingSession(false);
          loadMyLeads();
        }
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const loadMyLeads = async () => {
    setLoadingLeads(true);
    try {
      const data = await api.getMyLeads();
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleLeadCreated = () => {
    setShowNewForm(false);
    loadMyLeads();
  };

  if (loadingSession) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center text-slate-500 font-medium">
        Loading client portal...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-xl mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-block rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/20 mb-3">
              Client Portal
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome back, {client?.name || "Partner"}!
            </h1>
            <p className="mt-2 text-indigo-200 text-sm max-w-xl">
              Track your active project inquiries, view submission statuses, or submit a new project request.
            </p>
          </div>
          <div>
            <button
              onClick={() => setShowNewForm((prev) => !prev)}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 shadow-md transition hover:bg-indigo-50 hover:shadow-lg"
            >
              {showNewForm ? "Close Form" : "+ New Project Request"}
            </button>
          </div>
        </div>
      </div>

      {/* Optional Form Drawer/Modal */}
      {showNewForm && (
        <div className="mb-10 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Submit New Project Inquiry</h2>
          <LeadForm onSuccess={handleLeadCreated} defaultEmail={client?.email} defaultName={client?.name} />
        </div>
      )}

      {/* Submissions Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Your Submissions</h2>
          <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 px-3 py-1 rounded-full">
            {leads.length} {leads.length === 1 ? "Inquiry" : "Inquiries"}
          </span>
        </div>

        {loadingLeads ? (
          <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
            Loading your project submissions...
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No project inquiries yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              Ready to start your next project? Submit an inquiry and our team will get back to you shortly.
            </p>
            <button
              onClick={() => setShowNewForm(true)}
              className="mt-5 inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Submit First Project
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">Budget Range</span>
                    <p className="text-base font-bold text-slate-900">{lead.budget_range}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      Submitted {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                    <StatusBadge status={lead.status} />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Project Requirements / Message
                  </span>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {lead.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  let style = "bg-slate-100 text-slate-700 border-slate-200";
  if (status === "New") style = "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "Contacted") style = "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "Closed") style = "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${style}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
