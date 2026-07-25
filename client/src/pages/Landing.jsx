import LeadForm from "../components/LeadForm.jsx";

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
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
