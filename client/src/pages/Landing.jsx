import LeadForm from "../components/LeadForm.jsx";

export default function Landing() {
  return (
    <div className="py-12 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Hero Marketing Copy */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3.5 py-1 text-xs font-bold text-indigo-700 mb-6">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              Accepting New Software Projects
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
              Let's build something <span className="text-indigo-600">worth shipping</span>.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 max-w-2xl">
              Partner with expert engineers and designers. Tell us about your project vision and budget, and our team will get back to you with a proposal within one business day.
            </p>

            <div className="mt-8 flex items-center gap-6 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Fast Turnaround
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Transparent Pricing
              </div>
            </div>
          </div>

          {/* Lead Form Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Start a Project</h2>
              <p className="text-xs text-slate-500 mb-6">Fill out the quick inquiry form below.</p>
              <LeadForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
