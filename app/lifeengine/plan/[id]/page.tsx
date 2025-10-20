"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Plan = {
  id: string;
  profileId: string;
  intakeId: string;
  days: {
    date: string;
    activities: {
      type: string;
      name: string;
      duration: number;
      description: string;
    }[];
    meals: {
      type: string;
      name: string;
      calories: number;
      description: string;
    }[];
  }[];
};

type Props = {
  params: { id: string };
};

export default function PlanDetailPage({ params }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlan();
  }, [params.id]);

  const loadPlan = async () => {
    try {
      const response = await fetch(`/api/lifeengine/getPlan?id=${params.id}`);
      if (!response.ok) throw new Error("Failed to load plan");
      const data = await response.json();
      setPlan(data.plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.page}>Loading plan...</div>;
  if (error) return <div className={styles.page}>Error: {error}</div>;
  if (!plan) return <div className={styles.page}>Plan not found</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Your Personalized Plan</h1>
          <p className={styles.subtitle}>Plan #{plan.id.slice(-8)}</p>
        </div>
        <Link href="/lifeengine/dashboard" className={styles.backBtn}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className={styles.days}>
        {plan.days.map((day, index) => (
          <div key={day.date} className={styles.day}>
            <div className={styles.dayHeader}>
              <h2>Day {index + 1}</h2>
              <span className={styles.date}>
                {new Date(day.date).toLocaleDateString()}
              </span>
            </div>

            {day.activities.length > 0 && (
              <div className={styles.section}>
                <h3>Activities</h3>
                <div className={styles.items}>
                  {day.activities.map((activity, i) => (
                    <div key={i} className={styles.item}>
                      <div className={styles.itemHeader}>
                        <span className={styles.type}>{activity.type}</span>
                        <span className={styles.duration}>{activity.duration} min</span>
                      </div>
                      <h4>{activity.name}</h4>
                      <p>{activity.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {day.meals.length > 0 && (
              <div className={styles.section}>
                <h3>Meals</h3>
                <div className={styles.items}>
                  {day.meals.map((meal, i) => (
                    <div key={i} className={styles.item}>
                      <div className={styles.itemHeader}>
                        <span className={styles.type}>{meal.type}</span>
                        <span className={styles.calories}>{meal.calories} cal</span>
                      </div>
                      <h4>{meal.name}</h4>
                      <p>{meal.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
