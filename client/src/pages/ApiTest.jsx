import { useState } from "react";
import { api } from "../lib/api.js";

export default function ApiTest() {
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(false);

  const runCall = async (name, apiFunc, ...args) => {
    setLoading(true);
    setOutput({ calling: name, status: "pending..." });
    try {
      const res = await apiFunc(...args);
      setOutput({ calling: name, status: "success", data: res });
    } catch (err) {
      setOutput({ calling: name, status: "error", error: err.message || err.toString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">API Test Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <button
            onClick={() => runCall("api.submitLead", api.submitLead, {
              name: "Test User",
              email: "test@example.com",
              budget_range: "1k-5k",
              message: "This is a test message from the API dashboard."
            })}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Submit Lead (Public)
          </button>

          <button
            onClick={() => runCall("api.signup", api.signup, "testadmin", "password123")}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Admin Sign Up (testadmin)
          </button>

          <button
            onClick={() => runCall("api.login", api.login, "testadmin", "password123")}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Admin Login (testadmin)
          </button>

          <button
            onClick={() => runCall("api.session", api.session)}
            disabled={loading}
            className="rounded-lg bg-slate-600 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Check Session
          </button>

          <button
            onClick={() => runCall("api.getLeads", api.getLeads)}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            Get Leads (Auth req)
          </button>

          <button
            onClick={() => runCall("api.logout", api.logout)}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Admin Logout
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-100 border-b border-slate-200 px-4 py-2">
            <h2 className="text-sm font-semibold text-slate-700">API Response Output</h2>
          </div>
          <div className="p-4 bg-slate-900 text-green-400 font-mono text-sm overflow-x-auto min-h-[300px]">
            {output ? (
              <pre>{JSON.stringify(output, null, 2)}</pre>
            ) : (
              <p className="text-slate-500 italic">Click a button above to test an API call.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
