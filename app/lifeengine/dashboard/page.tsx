"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  if (loading) return <div className={styles.page}>Loading...</div>;
  if (error) return <div className={styles.page}>Error: {error}</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>My Plans</h1>
        <Link href="/lifeengine/create" className={styles.createBtn}>
          Create New Plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className={styles.empty}>
          <p>No plans yet. Create your first personalized plan!</p>
          <Link href="/lifeengine/create" className={styles.createBtn}>
            Get Started
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {plans.map((plan) => (
            <div key={plan.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Plan #{plan.id.slice(-8)}</h3>
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
              <Link href={`/lifeengine/plan/${plan.id}`} className={styles.viewBtn}>
                View Plan
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
