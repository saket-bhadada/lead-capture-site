import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api.js";

export default function ClientLayout() {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api
      .clientSession()
      .then((res) => {
        if (res.authenticated) {
          setClient(res.client);
        } else {
          setClient(null);
        }
      })
      .catch(() => setClient(null))
      .finally(() => setLoading(false));
  }, [location.pathname]);

  const handleLogout = async () => {
    await api.clientLogout();
    setClient(null);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
      {/* Client Marketing Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-sm shadow-sm">
              LS
            </span>
            <span>LeadSpark</span>
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              to="/"
              className={`transition hover:text-indigo-600 ${
                location.pathname === "/" ? "text-indigo-600 font-semibold" : "text-slate-600"
              }`}
            >
              Home
            </Link>

            {client ? (
              <>
                <Link
                  to="/dashboard"
                  className={`transition hover:text-indigo-600 ${
                    location.pathname === "/dashboard" ? "text-indigo-600 font-semibold" : "text-slate-600"
                  }`}
                >
                  My Submissions
                </Link>
                <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                    {client.name || client.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-semibold text-slate-500 hover:text-red-600 transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-slate-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold transition hover:bg-indigo-700 shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1">
        <Outlet context={{ client, setClient }} />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} LeadSpark Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="hover:text-slate-600 transition">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
