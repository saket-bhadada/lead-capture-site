import { useState, useEffect } from "react";
import { api } from "../lib/api.js";

export default function Health() {
  const [status, setStatus] = useState("checking");
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await api.checkHealth();
        if (res.ok) {
          setStatus("online");
        } else {
          setStatus("error");
          setError("Server returned non-ok response");
        }
      } catch (err) {
        setStatus("error");
        setError(err.message || "Failed to reach server");
      }
    };
    
    checkServer();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">
          System Health
        </h1>
        
        <div className="flex flex-col items-center justify-center gap-4">
          {status === "checking" && (
            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              Checking connection...
            </div>
          )}
          
          {status === "online" && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-emerald-700 font-semibold text-lg">Server is online</p>
              <p className="text-sm text-slate-500">API connection established successfully.</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-700 font-semibold text-lg">Server error</p>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
