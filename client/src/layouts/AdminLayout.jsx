import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";

export default function AdminLayout() {
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleLogout = async () => {
    await api.logout();
    navigate("/admin/login");
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400 font-medium">
        Verifying admin authorization...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Dark Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-black text-xs tracking-wider">
            ADM
          </div>
          <div>
            <h2 className="font-bold text-white text-sm tracking-wide">Admin Control</h2>
            <p className="text-xs text-slate-400 font-mono">LeadSpark OS</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 text-xs font-semibold">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Management
          </div>
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
              location.pathname.startsWith("/admin")
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Leads Database
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 text-xs">
            <span className="flex items-center gap-2 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              API Active
            </span>
            <span className="text-slate-500 font-mono">v1.2.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content & Top Header Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900">Platform Management</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              Admin Protected
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-600">Administrator</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Dense Full-Width Data Canvas */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
