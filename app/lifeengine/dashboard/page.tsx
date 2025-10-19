import PlansTable from "@/components/lifeengine/PlansTable";

export default function Dashboard() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 px-8 py-10 text-white shadow-2xl">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            LifeEngine
          </span>
          <h1 className="text-4xl font-semibold sm:text-5xl">Plans Dashboard</h1>
          <p className="max-w-3xl text-sm text-white/70">
            Review every generated plan, monitor verifier warnings, and hand off to operations without leaving this surface.
          </p>
        </div>
      </section>

      <PlansTable />
    </div>
  );
}
