import PlanCreator from "@/components/lifeengine/PlanCreator";

export default function LifeEnginePlanPage() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-900 via-violet-900 to-slate-900 px-8 py-10 text-white shadow-2xl">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            LifeEngine
          </span>
          <h1 className="text-4xl font-semibold sm:text-5xl">Plan Creator</h1>
          <p className="max-w-3xl text-sm text-white/70">
            Select a saved profile, set granular goals, and generate a Gemini-powered weekly booster plan. Each output stays within the member’s time budget and respects medical flags.
          </p>
        </div>
      </section>

      <PlanCreator />

      <section className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-inner">
        <h2 className="text-lg font-semibold text-slate-900">Plan generation workflow</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>Pick the member profile you want to serve.</li>
          <li>Toggle goals, modules, and lifestyle constraints. Notes feed directly into the Gemini planner.</li>
          <li>Review the live summary to confirm tone, modules, and flags before generating.</li>
          <li>Download the produced plan from the dashboard as a PDF or Word doc for coach hand-off.</li>
        </ol>
      </section>
    </div>
  );
}
