"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";
type PlanRow = { planId:string; days:number; confidence:number; warnings:string[]; profileId:string; createdAt?:string; goals?:string[] };
export default function Dashboard(){
  const { data, isLoading, error } = useSWR<{ plans: PlanRow[] }>("/api/lifeengine/plan/listByProfile?profileId=all", fetcher);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
        {error && <p className="text-sm text-red-600">Error loading plans</p>}
        <ul className="divide-y">
          {(data?.plans || []).map((p) => (
            <li key={p.planId} className="py-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{p.planId}</div>
                <div className="text-gray-500">Days {p.days} • Conf {p.confidence?.toFixed(2)} • Warnings {(p.warnings||[]).length}</div>
              </div>
              <a href={`/lifeengine/plan/${p.planId}`} className="px-3 py-1 rounded border">View</a>
            </li>
          ))}
          {(!data?.plans || data.plans.length === 0) && <li className="py-8 text-center text-gray-500">No plans created yet.</li>}
        </ul>
      </section>
    </div>
  );
}
