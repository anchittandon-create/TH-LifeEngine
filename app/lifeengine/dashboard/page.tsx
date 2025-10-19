"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./Dashboard.module.css";
import type { Profile } from "@/lib/domain/profile";
import type { Plan } from "@/lib/domain/plan";
import { getProfiles, getPlans, StoredPlan } from "@/lib/utils/store";

type ServerPlan = {
  id: string;
  profileId: string;
  title: string;
  createdAt: number;
  goals: string[];
  warnings: number;
  analytics: Plan["analytics"];
};

type PlanCard = {
  id: string;
  title: string;
  profileId: string;
  createdAt: number;
  goals: string[];
  warnings: number;
  analytics: Plan["analytics"];
  source: "server" | "local";
};

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const [profileFilter, setProfileFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfiles(getProfiles());
    const localPlans = getPlans().map(toLocalCard);
    setPlans(localPlans);
    refreshServer(localPlans);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshServer = async (existing: PlanCard[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/lifeengine/listPlans?profileId=all");
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      const data = await response.json();
      const serverPlans: PlanCard[] = (data.plans as ServerPlan[]).map((plan) => ({
        ...plan,
        source: "server" as const,
      }));
      const merged = mergePlans(existing, serverPlans);
      setPlans(merged);
    } catch (err: any) {
      setError(err.message ?? "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans
      .filter((plan) =>
        profileFilter === "all" ? true : plan.profileId === profileFilter
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [plans, profileFilter]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.toolbar}>
          <select
            value={profileFilter}
            onChange={(event) => setProfileFilter(event.target.value)}
          >
            <option value="all">All profiles</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => refreshServer(plans)}>
            Refresh
          </button>
        </div>
      </div>
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      {loading && <p style={{ color: "#475569" }}>Refreshing…</p>}
      {filteredPlans.length > 0 ? (
        <div className={styles.grid}>
          {filteredPlans.map((plan) => (
            <article key={plan.id} className={styles.card}>
              <div>
                <div className={styles.cardTitle}>{plan.title}</div>
                <div className={styles.meta}>
                  <span>
                    {new Date(plan.createdAt).toLocaleString()}
                  </span>
                  <span>{plan.source === "server" ? "Cloud" : "Local"}</span>
                  <span>Warnings {plan.warnings}</span>
                </div>
              </div>
              <div className={styles.scoreBar}>
                <div
                  className={styles.scoreFill}
                  style={{ width: `${Math.min(1, plan.analytics.overall) * 100}%` }}
                />
              </div>
              <div className={styles.badges}>
                {plan.goals.map((goal) => (
                  <span key={goal} className={styles.badge}>
                    {goal}
                  </span>
                ))}
              </div>
              <Link className={styles.link} href={`/lifeengine/plan/${plan.id}`}>
                Open Plan
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          No plans yet. Generate one from the Create page.
        </div>
      )}
    </div>
  );
}

function toLocalCard(plan: StoredPlan): PlanCard {
  return {
    id: plan.id,
    title: plan.plan.meta?.title || 'Untitled',
    profileId: plan.profileId,
    createdAt: plan.createdAt,
    goals: plan.plan.meta?.goals ?? [],
    warnings: plan.warnings.length,
    analytics: plan.analytics,
    source: "local",
  };
}

function mergePlans(local: PlanCard[], server: PlanCard[]) {
  const map = new Map<string, PlanCard>();
  [...local, ...server].forEach((plan) => {
    if (!map.has(plan.id) || plan.source === "local") {
      map.set(plan.id, plan);
    }
  });
  return Array.from(map.values());
}
