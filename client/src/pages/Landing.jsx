import { Link } from "react-router-dom";
import LeadForm from "../components/LeadForm.jsx";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="flex items-center justify-end gap-4 p-6">
        <Link 
          to="/health" 
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          System Health
        </Link>
        <Link 
          to="/admin/login" 
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Admin Login
        </Link>
        <Link 
          to="/admin/signup" 
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Sign Up
        </Link>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Let's build something worth shipping.
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Tell us a bit about your project and budget, and we'll get back to you within one
              business day.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <LeadForm />
          </div>
        </div>
      </div>
    </div>
  );
}
