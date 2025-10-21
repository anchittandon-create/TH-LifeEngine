"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
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

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <Skeleton className={styles.titleSkeleton} />
            <Skeleton className={styles.subtitleSkeleton} />
          </div>
          <Skeleton className={styles.buttonSkeleton} />
        </header>
        <div className={styles.days}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={styles.day}>
              <Skeleton className={styles.dayHeaderSkeleton} />
              <div className={styles.section}>
                <Skeleton className={styles.sectionTitleSkeleton} />
                <div className={styles.items}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className={styles.item}>
                      <Skeleton className={styles.itemHeaderSkeleton} />
                      <Skeleton className={styles.itemTitleSkeleton} />
                      <Skeleton className={styles.itemTextSkeleton} />
                    </div>
                  ))}
                </div>
              </div>
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
          <h2 className={styles.errorTitle}>Unable to load plan</h2>
          <p className={styles.errorMessage}>{error}</p>
          <div className={styles.errorActions}>
            <Button onClick={loadPlan}>Try Again</Button>
            <Link href="/lifeengine/dashboard">
              <Button variant="ghost">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2 className={styles.errorTitle}>Plan not found</h2>
          <p className={styles.errorMessage}>The requested plan could not be found.</p>
          <Link href="/lifeengine/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Personalized Health Plan</h1>
          <p className={styles.subtitle}>Plan #{plan.id.slice(-8)}</p>
        </div>
        <Link href="/lifeengine/dashboard">
          <Button variant="ghost">← Back to Dashboard</Button>
        </Link>
      </header>

      <div className={styles.days}>
        {plan.days.map((day, index) => (
          <div key={day.date} className={styles.day}>
            <div className={styles.dayHeader}>
              <h2 className={styles.dayTitle}>Day {index + 1}</h2>
              <span className={styles.date}>
                {new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            {day.activities.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Activities</h3>
                <div className={styles.items}>
                  {day.activities.map((activity, i) => (
                    <div key={i} className={styles.item}>
                      <div className={styles.itemHeader}>
                        <span className={styles.type}>{activity.type}</span>
                        <span className={styles.duration}>{activity.duration} min</span>
                      </div>
                      <h4 className={styles.itemTitle}>{activity.name}</h4>
                      <p className={styles.itemDescription}>{activity.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {day.meals.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Meals</h3>
                <div className={styles.items}>
                  {day.meals.map((meal, i) => (
                    <div key={i} className={styles.item}>
                      <div className={styles.itemHeader}>
                        <span className={styles.type}>{meal.type}</span>
                        <span className={styles.calories}>{meal.calories} cal</span>
                      </div>
                      <h4 className={styles.itemTitle}>{meal.name}</h4>
                      <p className={styles.itemDescription}>{meal.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
