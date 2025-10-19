"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import { normalizePlanStructure, NormalizedPlan } from "@/lib/utils/planTransform";
import { getFullUrl } from "@/lib/utils/urls";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Profile = {
  id: string;
  name: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
};

type Meal = {
  meal: "breakfast" | "lunch" | "snack" | "dinner";
  catalog_id: string;
  name: string;
  swap_suggestions: string[];
};

type PlanDetail = {
  planId: string;
  profileId: string;
  days: number;
  confidence: number;
  warnings: string[];
  planJSON: {
    meta?: {
      title: string;
      duration_days: number;
      weeks: number;
      goals: string[];
      flags: string[];
      dietary: { type: string; allergies: string[]; cuisine_pref: string };
      time_budget_min_per_day: number;
      notes: string;
    };
    weekly_plan?: Array<{
      week_index: number;
      focus: string;
      progression_note: string;
      days: Array<{
        day_index: number;
        theme: string;
        yoga: Array<{ name: string; duration_min: number }>;
        breath_mindfulness: Array<{ name: string; duration_min: number }>;
        habit_tasks: string[];
        nutrition: {
          kcal_target: number;
          meals: Meal[];
        };
        hydration_ml_target: number;
        sleep: { wind_down_min: number; tip: string };
        notes: string;
      }>;
    }>;
    days?: Array<{
      date?: string;
      yoga: Array<{ flowId: string; durationMin: number }>;
      meals: Array<{ itemId: string; qty: string }>;
      habits: string[];
      sleep?: { windDownMin: number };
    }>;
    safety_warnings?: string[];
    adherence_tips?: string[];
  };
  createdAt?: string;
};

type PlanRow = {
  planId: string;
  profileId: string;
  days: number;
  confidence: number;
  warnings: string[];
  createdAt?: string;
};

export default function PlansTable() {
  const { data: profilesRes } = useSWR<{ profiles: Profile[] }>("/api/lifeengine/profiles/list", fetcher);
  const profiles = profilesRes?.profiles ?? [];
  const [profileId, setProfileId] = useState("");

  const { data, isLoading } = useSWR<{ plans: PlanRow[] }>(
    profileId ? `/api/lifeengine/plan/listByProfile?profileId=${profileId}` : null,
    fetcher,
  );

  const plans = data?.plans ?? [];
  const selectedProfile = useMemo(() => profiles.find((profile) => profile.id === profileId), [profiles, profileId]);
  const [viewingPlan, setViewingPlan] = useState<PlanDetail | null>(null);
  const [normalizedView, setNormalizedView] = useState<NormalizedPlan | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  async function openPlan(planId: string) {
    setViewError(null);
    setViewLoading(true);
    try {
      const res = await fetch(`/api/lifeengine/plan/detail?planId=${planId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Unable to fetch plan");
      const detail = json.plan as PlanDetail;
      setViewingPlan(detail);
      setNormalizedView(normalizePlanStructure(detail.planId, detail.planJSON, detail.warnings));
    } catch (error: any) {
      setViewError(error.message ?? "Unexpected error");
    } finally {
      setViewLoading(false);
    }
  }

  function closeModal() {
    setViewingPlan(null);
    setNormalizedView(null);
    setViewError(null);
  }

  return (
    <>
    <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/90 p-6 shadow-xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Plans Dashboard</h2>
          <p className="text-sm text-slate-500">Filter generated plans by profile and review verification status.</p>
        </div>
        <select
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">Select profile…</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </select>
      </header>

      {!profileId ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-500">
          Choose a profile to see the plans generated for them.
        </div>
      ) : isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-inner">
          Loading plans…
        </div>
      ) : plans.length ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Plan</th>
                <th className="px-5 py-3 text-left">Confidence</th>
                <th className="px-5 py-3 text-left">Warnings</th>
                <th className="px-5 py-3 text-left">Created</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plans.map((plan) => (
                <tr key={plan.planId} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-slate-900">{plan.planId}</span>
                      <span className="text-xs text-slate-500">{plan.days} days</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {plan.confidence.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        plan.warnings.length
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {plan.warnings.length}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {plan.createdAt
                      ? formatDistanceToNow(new Date(plan.createdAt), { addSuffix: true })
                      : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        onClick={() => openPlan(plan.planId)}
                        className="rounded-full border border-slate-300 px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
                      >
                        View
                      </button>
                      <a
                        href={getFullUrl(`/api/lifeengine/plan/export/pdf?planId=${plan.planId}`)}
                        className="rounded-full border border-indigo-400 px-3 py-1 font-semibold text-indigo-600 transition hover:bg-indigo-100"
                      >
                        PDF
                      </a>
                      <a
                        href={getFullUrl(`/api/lifeengine/plan/export/doc?planId=${plan.planId}`)}
                        className="rounded-full border border-emerald-400 px-3 py-1 font-semibold text-emerald-600 transition hover:bg-emerald-100"
                      >
                        Word
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-500 shadow-inner">
          No plans yet for {selectedProfile?.name ?? "this profile"}. Generate one from the Plan Studio.
        </div>
      )}
    </section>
      {viewingPlan && normalizedView ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{normalizedView.meta.title}</h3>
                <p className="text-xs text-slate-500">Plan ID: {viewingPlan.planId}</p>
                {(() => {
                  const contactProfile = profiles.find((profile) => profile.id === viewingPlan.profileId);
                  if (!contactProfile) return null;
                  const contactPieces = [
                    contactProfile.contact?.email,
                    contactProfile.contact?.phone,
                    contactProfile.contact?.location,
                  ].filter(Boolean);
                  return (
                    <div className="mt-1 text-[11px] text-slate-500">
                      {contactPieces.join(" • ")}
                    </div>
                  );
                })()}
              </div>
              <button
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm text-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</p>
                  <p>{normalizedView.meta.duration_days} days</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Goals</p>
                  <p>{normalizedView.meta.goals.join(", ") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time Budget</p>
                  <p>{normalizedView.meta.time_budget_min_per_day} min/day</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flags</p>
                  <p>{normalizedView.meta.flags.join(", ") || "None"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weeks</p>
                <div className="mt-2 space-y-3">
                  {normalizedView.weeks.map((week) => (
                    <div
                      key={`${viewingPlan.planId}-week-${week.week_index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner"
                    >
                      <h4 className="text-sm font-semibold text-slate-900">
                        Week {week.week_index}: {week.focus}
                      </h4>
                      <p className="text-xs text-slate-500">Progression: {week.progression_note}</p>
                      <div className="mt-2 grid gap-2">
                        {week.days.map((day) => (
                          <div key={`${week.week_index}-${day.day_index}`} className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs font-semibold text-slate-700">
                              Day {day.day_index} · {day.theme}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Yoga:{" "}
                              {day.yoga
                                ?.map((y: any) => `${y.name ?? y.flowId} (${y.duration_min ?? y.durationMin ?? 0}m)`)
                                .join(", ") || "None"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Meals:{" "}
                              {day.nutrition?.meals
                                ?.map((meal: any) => `${meal.meal}: ${meal.name}`)
                                .join(" | ") || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {viewError ? (
        <div className="fixed bottom-6 right-6 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 shadow">
          {viewError}
        </div>
      ) : null}
      {viewLoading ? (
        <div className="fixed bottom-6 right-6 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow">
          Loading plan…
        </div>
      ) : null}
    </>
  );
}
