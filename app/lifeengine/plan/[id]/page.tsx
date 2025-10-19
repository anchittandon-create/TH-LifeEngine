"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import Segmented from "@/components/ui/Segmented";
export default function PlanDetailPage({ params }: { params: { id: string } }){
  const router = useRouter();
  const sp = useSearchParams();
  const view = sp.get("view") ?? "overview";
  const setView = (v: string) => router.replace(`?view=${v}`, { scroll: false });

  const options = useMemo(() => ([
    { value: "overview", label: "Overview" },
    { value: "weekly", label: "Weekly" },
    { value: "daily", label: "Daily" },
    { value: "citations", label: "Citations" },
  ]), []);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Plan {params.id}</h1>
          <p className="text-sm text-gray-600">Single-selection sub-nav (no multi-tabs)</p>
        </div>
        <Segmented value={view} onChange={setView} options={options} ariaLabel="Plan view" />
      </header>

      {view === "overview" && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">Overview</h2>
          <p className="text-sm text-gray-600">Show meta, warnings, tips (hook to API).</p>
        </section>
      )}
      {view === "weekly" && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">Weekly</h2>
          <p className="text-sm text-gray-600">Render weekly accordion (hook to plan JSON).</p>
        </section>
      )}
      {view === "daily" && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">Daily</h2>
          <p className="text-sm text-gray-600">7-col grid on desktop; vertical list on mobile.</p>
        </section>
      )}
      {view === "citations" && (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-medium">Citations</h2>
          <p className="text-sm text-gray-600">Table of sources with links.</p>
        </section>
      )}
    </div>
  );
}
