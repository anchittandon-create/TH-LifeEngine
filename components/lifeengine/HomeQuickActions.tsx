"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

type DraftInfo = {
  exists: boolean;
  updatedAt?: string;
};

function usePlanDraft(): DraftInfo {
  const [draft, setDraft] = useState<DraftInfo>({ exists: false });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("lifeengine.plan.draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        setDraft({ exists: true, updatedAt: parsed?.updatedAt });
      }
    } catch (error) {
      console.warn("Failed to read plan draft", error);
    }
  }, []);

  return draft;
}

export function HomeQuickActions() {
  const draft = usePlanDraft();

  const actions = [
    {
      title: "Resume last draft",
      description: draft.exists ? `Pick up where you left off${draft.updatedAt ? ` · Updated ${new Date(draft.updatedAt).toLocaleString()}` : ""}` : "Drafts are saved automatically while you create a plan.",
      action: draft.exists ? (
        <Button asChild variant="primary">
          <Link href="/lifeengine/create">Open draft</Link>
        </Button>
      ) : (
        <Button variant="ghost" disabled>
          No draft yet
        </Button>
      ),
    },
    {
      title: "View dashboard",
      description: "Monitor plan quality, warnings, and recent activity across profiles.",
      action: (
        <Button asChild variant="secondary">
          <Link href="/lifeengine/dashboard">Open dashboard</Link>
        </Button>
      ),
    },
    {
      title: "Manage profiles",
      description: "Keep member demographics and health context up-to-date.",
      action: (
        <Button asChild variant="secondary">
          <Link href="/lifeengine/profiles">Manage profiles</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {actions.map((item) => (
        <div key={item.title} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="text-xs text-slate-600">{item.description}</p>
          </div>
          <div className="pt-4">{item.action}</div>
        </div>
      ))}
    </div>
  );
}

export function HomeQuickActionsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </div>
  );
}
