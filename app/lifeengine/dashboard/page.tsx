"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/utils/fetcher";

interface Plan {
  planId: string;
  days: number;
  confidence: number;
}

interface DashboardData {
  plans: Plan[];
}

export default function Dashboard() {
  const { data, isLoading, error } = useSWR<DashboardData>(
    "/api/lifeengine/plan/listByProfile?profileId=all",
    fetcher,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        {isLoading && "Loading…"}
        {error && "Error"}
        <ul className="divide-y">
          {data?.plans?.map((p: Plan) => (
            <li key={p.planId} className="py-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{p.planId}</div>
                <div className="text-gray-500">
                  Days {p.days} • Conf {p.confidence?.toFixed?.(2) ?? "—"}</div>
              </div>
              <a href={`/lifeengine/plan/${p.planId}`} className="px-3 py-1 rounded border">
                View
              </a>
            </li>
          ))}
          {(!data?.plans || data.plans.length === 0) && (
            <li className="py-8 text-center text-gray-500">No plans yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
