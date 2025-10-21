"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import styles from "./page.module.css";

type PlanSummary = {
  id: string;
  profileId: string;
  intakeId: string;
  createdAt: string;
  goals: string[];
};

export default function DashboardPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/lifeengine/listPlans");
      if (!response.ok) throw new Error("Failed to load plans");
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Skeleton className={styles.titleSkeleton} />
          <Skeleton className={styles.buttonSkeleton} />
        </div>
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.card}>
              <Skeleton className={styles.cardHeaderSkeleton} />
              <div className={styles.goals}>
                <Skeleton className={styles.goalSkeleton} />
                <Skeleton className={styles.goalSkeleton} />
                <Skeleton className={styles.goalSkeleton} />
              </div>
              <Skeleton className={styles.buttonSkeleton} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2 className={styles.errorTitle}>Something went wrong</h2>
          <p className={styles.errorMessage}>{error}</p>
          <Button onClick={loadPlans}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>My Health Plans</h1>
          <p className={styles.subtitle}>
            View and manage your personalized health plans
          </p>
        </div>
        <Link href="/lifeengine/create">
          <Button>Create New Plan</Button>
        </Link>
      </header>

      {plans.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyContent}>
            <h2 className={styles.emptyTitle}>No plans yet</h2>
            <p className={styles.emptyText}>
              Create your first personalized health plan to get started on your wellness journey.
            </p>
            <Link href="/lifeengine/create">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {plans.map((plan) => (
            <div key={plan.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Plan #{plan.id.slice(-8)}</h3>
                <span className={styles.date}>
                  {new Date(plan.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.goals}>
                {plan.goals.slice(0, 3).map((goal, i) => (
                  <span key={i} className={styles.goal}>
                    {goal}
                  </span>
                ))}
                {plan.goals.length > 3 && (
                  <span className={styles.more}>+{plan.goals.length - 3} more</span>
                )}
              </div>
              <Link href={`/lifeengine/plan/${plan.id}`}>
                <Button variant="ghost" className={styles.viewButton}>
                  View Plan
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
