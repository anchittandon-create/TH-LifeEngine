import Profiles from "@/components/lifeengine/Profiles";

export default function LifeEngineProfilesPage() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 px-8 py-10 text-white shadow-2xl">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            LifeEngine
          </span>
          <h1 className="text-4xl font-semibold sm:text-5xl">Member Profiles</h1>
          <p className="max-w-3xl text-sm text-white/70">
            Record comprehensive demographic and contact information for every subscriber. The plan creator pulls directly from these records to keep AI output aligned with reality.
          </p>
        </div>
      </section>

      <Profiles />

      <section className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-inner">
        <h2 className="text-lg font-semibold text-slate-900">Why profiles matter</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-800">AI-readiness</p>
            <p>Ensure every plan request includes age, anthropometrics, and lifestyle context for safer recommendations.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">Coach hand-offs</p>
            <p>Email / phone details sit here so human coaches can follow up without duplicate entry.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-800">Persistence</p>
            <p>Profiles are stored locally (or Firestore if configured) and survive rebuilds thanks to the seeded Anchit anchor profile.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
