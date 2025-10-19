"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Segmented from "@/components/ui/Segmented";
import styles from "./PlanDetail.module.css";
import type { Plan, Week } from "@/lib/domain/plan";
import { getPlans } from "@/lib/utils/store";

const segments = [
  { value: "overview", label: "Overview" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
  { value: "citations", label: "Citations" },
];

type PlanResponse = {
  planId: string;
  plan: Plan;
  warnings: string[];
  analytics: Plan["analytics"];
  profileId: string;
};

type Props = {
  params: { id: string };
};

export default function PlanDetailPage({ params }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PlanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const view = searchParams.get("view") ?? "overview";

  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/lifeengine/getPlan?id=${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            const local = getPlans().find((entry) => entry.id === params.id);
            if (local) {
              setData({
                planId: local.id,
                plan: local.plan,
                warnings: local.warnings,
                analytics: local.analytics,
                profileId: local.profileId,
              });
              return;
            }
          }
          throw new Error(`Status ${response.status}`);
        }
        const result = await response.json();
        setData(result as PlanResponse);
      } catch (err: any) {
        setError(err.message ?? "Unable to load plan");
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [params.id]);

  const setView = (value: string) => {
    const paramsCopy = new URLSearchParams(searchParams.toString());
    paramsCopy.set("view", value);
    router.replace(`?${paramsCopy.toString()}`, { scroll: false });
  };

  const flattenedDays = useMemo(() => {
    if (!data) return [];
    const days: { week: Week; dayIndex: number; weekIndex: number }[] = [];
    data.plan.weekly_plan.forEach((week) => {
      week.days.forEach((day) => {
        days.push({ week, dayIndex: day.day_index, weekIndex: week.week_index });
      });
    });
    return days;
  }, [data]);

  if (loading) {
    return <p className={styles.loading}>Loading plan…</p>;
  }

  if (error) {
    return <p style={{ color: "#b91c1c" }}>{error}</p>;
  }

  if (!data) {
    return <p className={styles.loading}>Plan not available.</p>;
  }

  const { plan, warnings, analytics } = data;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{plan.meta.title}</h1>
          <div className={styles.badges}>
            {plan.meta.goals.map((goal) => (
              <span key={goal} className={styles.badge}>
                {goal}
              </span>
            ))}
          </div>
        </div>
        <Segmented value={view} onChange={setView} options={segments} />
      </header>

      <section className={styles.overviewCard}>
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            Duration: {plan.meta.duration_days} days
          </div>
          <div className={styles.metaItem}>
            Weeks: {plan.meta.weeks}
          </div>
          <div className={styles.metaItem}>
            Daily Budget: {plan.meta.time_budget_min_per_day} minutes
          </div>
          <div className={styles.metaItem}>
            Hydration ensured &bull; Analytics overall {analytics.overall}
          </div>
        </div>
        {warnings.length > 0 && (
          <div className={styles.warningBlock}>
            <strong>Warnings</strong>
            <ul>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {view === "overview" && (
        <section className={styles.sectionCard}>
          <h2>Coach Messages</h2>
          <ul className={styles.list}>
            {plan.coach_messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <h3>Adherence Tips</h3>
          <ul className={styles.list}>
            {plan.adherence_tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}

      {view === "weekly" && (
        <section className={styles.sectionCard}>
          <h2>Weekly Progression</h2>
          <div className={styles.dayGrid}>
            {plan.weekly_plan.map((week) => (
              <article key={week.week_index} className={styles.week}>
                <div className={styles.weekHeader}>
                  <span>Week {week.week_index}</span>
                  <span>{week.focus}</span>
                </div>
                <p>{week.progression_note}</p>
                <ul className={styles.list}>
                  {week.days.map((day) => (
                    <li key={day.day_index}>
                      Day {day.day_index} · {day.theme ?? "Theme pending"}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {view === "daily" && (
        <section className={styles.sectionCard}>
          <h2>Daily Detail</h2>
          <div className={styles.dayGrid}>
            {flattenedDays.map(({ week, dayIndex }) => {
              const day = week.days.find((item) => item.day_index === dayIndex);
              if (!day) return null;
              return (
                <div key={`${week.week_index}-${day.day_index}`} className={styles.dayCard}>
                  <div className={styles.dayTitle}>
                    Week {week.week_index} · Day {day.day_index} {day.theme ? `· ${day.theme}` : ""}
                  </div>
                  {day.yoga && day.yoga.length > 0 && (
                    <div>
                      <strong>Yoga</strong>
                      <ul className={styles.list}>
                        {day.yoga.map((flow) => (
                          <li key={flow.flow_id}>
                            {flow.name} — {flow.duration_min} min ({flow.intensity})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {day.breathwork && day.breathwork.length > 0 && (
                    <div>
                      <strong>Breathwork</strong>
                      <ul className={styles.list}>
                        {day.breathwork.map((item, index) => (
                          <li key={`${item.name}-${index}`}>
                            {item.name} — {item.duration_min} min
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {day.nutrition && (
                    <div>
                      <strong>Nutrition</strong>
                      <ul className={styles.list}>
                        <li>Kcal target {day.nutrition.kcal_target}</li>
                        {(day.nutrition.meals ?? []).map((meal, index) => (
                          <li key={`${meal.meal}-${index}`}>
                            {meal.meal}: {meal.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {day.habits && day.habits.length > 0 && (
                    <div>
                      <strong>Habits</strong>
                      <ul className={styles.list}>
                        {day.habits.map((habit) => (
                          <li key={habit}>{habit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {day.mindfulness && day.mindfulness.length > 0 && (
                    <div>
                      <strong>Mindfulness</strong>
                      <ul className={styles.list}>
                        {day.mindfulness.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {view === "citations" && (
        <section className={styles.sectionCard}>
          <h2>Citations</h2>
          <div className={styles.citations}>
            {plan.citations.length === 0 && <p>No citations provided.</p>}
            {plan.citations.map((citation) => (
              <div key={citation} className={styles.citation}>
                {citation}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
