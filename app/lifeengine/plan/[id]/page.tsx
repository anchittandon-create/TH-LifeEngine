"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { LifeEnginePlan, WeeklySchedule, DayPlan as CustomDayPlan } from "@/app/types/lifeengine";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import styles from "./page.module.css";

type RulePlan = {
  id: string;
  profileId: string;
  intakeId: string;
  days: {
    date: string;
    activities?: {
      type: string;
      name: string;
      duration: number;
      description: string;
    }[];
    meals?: {
      type: string;
      name: string;
      calories: number;
      description: string;
    }[];
  }[];
};

type NotebookDay = {
  dayNumber: number;
  dateLabel?: string;
  yoga: {
    title: string;
    duration?: string;
    steps: string[];
    notes?: string;
  } | null;
  exercise: {
    name: string;
    sets?: string;
    cues?: string;
    tips?: string;
  }[];
  meals: {
    title: string;
    recipe?: string[];
    portion?: string;
  }[];
  tips: string[];
};

type Props = { params: { id: string } };

export default function PlanDetailPage({ params }: Props) {
  const [rulePlan, setRulePlan] = useState<RulePlan | null>(null);
  const [customPlan, setCustomPlan] = useState<LifeEnginePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const notebookRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPlan();
  }, [params.id]);

  const notebookDays = useMemo<NotebookDay[]>(() => {
    if (customPlan) {
      return normalizeCustomPlan(customPlan.weekly_schedule);
    }
    if (rulePlan) {
      return normalizeRulePlan(rulePlan);
    }
    return [];
  }, [customPlan, rulePlan]);

  useEffect(() => {
    setSelectedDays(new Set(notebookDays.map((_, idx) => idx)));
    if (currentDayIndex >= notebookDays.length) {
      setCurrentDayIndex(0);
    }
  }, [notebookDays]);

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const detailRes = await fetch(`/api/lifeengine/plan/detail?planId=${params.id}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        if (detailData.plan?.weekly_schedule) {
          setCustomPlan(detailData.plan as LifeEnginePlan);
          setRulePlan(null);
          return;
        }
      }
      const response = await fetch(`/api/lifeengine/getPlan?id=${params.id}`);
      if (!response.ok) throw new Error("Failed to load plan");
      const data = await response.json();
      setRulePlan(data.plan);
      setCustomPlan(null);
    } catch (err: any) {
      setError(err.message || "Failed to load plan");
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async (daysToInclude: number[]) => {
    const container = printRef.current;
    if (!container) return;

    setDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      let isFirst = true;
      for (const idx of daysToInclude) {
        const pageEl = container.querySelector<HTMLDivElement>(`[data-day-index="${idx}"]`);
        if (!pageEl) continue;
        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        if (!isFirst) pdf.addPage();
        isFirst = false;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }
      pdf.save(`TH_LifeEngine_Plan_${params.id.slice(-8)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSelected = () => {
    if (!selectedDays.size) {
      alert("Select at least one day to export.");
      return;
    }
    generatePdf(Array.from(selectedDays).sort((a, b) => a - b));
  };

  const handleDownloadFull = () => {
    generatePdf(notebookDays.map((_, idx) => idx));
  };

  const toggleDaySelection = (index: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
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
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className={styles.daySkeleton}>
              <Skeleton className={styles.dayHeaderSkeleton} />
              <Skeleton className={styles.pageSkeleton} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || notebookDays.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <h2 className={styles.errorTitle}>Unable to load plan</h2>
          <p className={styles.errorMessage}>{error || "Plan not found."}</p>
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

  const currentDay = notebookDays[currentDayIndex];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notebook Plan</h1>
          <p className={styles.subtitle}>
            Plan #{(rulePlan?.id || params.id).slice(-8)} &middot; {notebookDays.length} days
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button onClick={handleDownloadSelected} disabled={downloading || selectedDays.size === 0}>
            {downloading ? "Exporting..." : "Download Selected Days"}
          </Button>
          <Button variant="ghost" onClick={handleDownloadFull} disabled={downloading}>
            Download Full Plan
          </Button>
          <Link href="/lifeengine/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <div className={styles.content}>
        <DayIndex
          days={notebookDays}
          current={currentDayIndex}
          selectedDays={selectedDays}
          onSelectDay={(index) => setCurrentDayIndex(index)}
          onToggleSelection={toggleDaySelection}
        />

        <section className={styles.notebook}>
          <NotebookNav
            current={currentDayIndex}
            total={notebookDays.length}
            onPrev={() => setCurrentDayIndex((prev) => Math.max(0, prev - 1))}
            onNext={() => setCurrentDayIndex((prev) => Math.min(notebookDays.length - 1, prev + 1))}
          />

          <div className={styles.dayPage} ref={notebookRef}>
            <DayPage day={currentDay} />
          </div>
        </section>

        {customPlan && (
          <section className={styles.previewSection}>
            <h2 className={styles.sectionTitle}>Detailed Notebook Preview</h2>
            <PlanPreview plan={customPlan} />
          </section>
        )}
      </div>

      {/* Hidden print container */}
      <div className={styles.printContainer} ref={printRef}>
        {notebookDays.map((day, idx) => (
          <div key={idx} data-day-index={idx} className={styles.printPage}>
            <DayPage day={day} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DayIndex({
  days,
  current,
  selectedDays,
  onSelectDay,
  onToggleSelection,
}: {
  days: NotebookDay[];
  current: number;
  selectedDays: Set<number>;
  onSelectDay: (index: number) => void;
  onToggleSelection: (index: number) => void;
}) {
  return (
    <aside className={styles.index}>
      <h3 className={styles.indexTitle}>Day Index</h3>
      <div className={styles.indexList}>
        {days.map((day, idx) => (
          <button
            key={idx}
            className={`${styles.indexItem} ${idx === current ? styles.activeIndex : ""}`}
            onClick={() => onSelectDay(idx)}
          >
            <div className={styles.indexHeader}>
              <span>Day {day.dayNumber}</span>
              <input
                type="checkbox"
                checked={selectedDays.has(idx)}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelection(idx);
                }}
              />
            </div>
            <small>{day.dateLabel || "Notebook Entry"}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}

function NotebookNav({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={styles.nav}>
      <Button variant="ghost" onClick={onPrev} disabled={current === 0}>
        ← Previous Day
      </Button>
      <span className={styles.navLabel}>
        Day {current + 1} of {total}
      </span>
      <Button variant="ghost" onClick={onNext} disabled={current === total - 1}>
        Next Day →
      </Button>
    </div>
  );
}

function DayPage({ day }: { day: NotebookDay }) {
  return (
    <div className={styles.pageCard}>
      <header className={styles.pageHeader}>
        <div>
          <h2>Day {day.dayNumber}</h2>
          {day.dateLabel && <p>{day.dateLabel}</p>}
        </div>
        <div className={styles.pageTags}>
          <span>🧘 Yoga</span>
          <span>🏋️ Training</span>
          <span>🥗 Meals</span>
        </div>
      </header>

      <section className={styles.section}>
        <h3>🧘 Yoga Practice</h3>
        {day.yoga ? (
          <div className={styles.card}>
            <h4>{day.yoga.title}</h4>
            {day.yoga.duration && <p className={styles.meta}>{day.yoga.duration}</p>}
            <ol className={styles.steps}>
              {day.yoga.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
            {day.yoga.notes && <p className={styles.notes}>{day.yoga.notes}</p>}
          </div>
        ) : (
          <p className={styles.placeholder}>No yoga practice scheduled.</p>
        )}
      </section>

      <section className={styles.section}>
        <h3>🏋️ Training</h3>
        {day.exercise.length ? (
          <div className={styles.grid}>
            {day.exercise.map((exercise, idx) => (
              <div key={idx} className={styles.card}>
                <h4>{exercise.name}</h4>
                {exercise.sets && <p className={styles.meta}>{exercise.sets}</p>}
                {exercise.cues && <p className={styles.notes}>{exercise.cues}</p>}
                {exercise.tips && <p className={styles.notes}>{exercise.tips}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.placeholder}>No specific training scheduled.</p>
        )}
      </section>

      <section className={styles.section}>
        <h3>🥗 Meals & Recipes</h3>
        {day.meals.length ? (
          <div className={styles.grid}>
            {day.meals.map((meal, idx) => (
              <div key={idx} className={styles.card}>
                <h4>{meal.title}</h4>
                {meal.portion && <p className={styles.meta}>{meal.portion}</p>}
                {meal.recipe?.length ? (
                  <ol className={styles.steps}>
                    {meal.recipe.map((step, stepIdx) => (
                      <li key={stepIdx}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className={styles.placeholder}>No recipe details provided.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.placeholder}>Meals not specified for this day.</p>
        )}
      </section>

      <section className={styles.section}>
        <h3>💡 Tips & Reminders</h3>
        {day.tips.length ? (
          <ul className={styles.tips}>
            {day.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.placeholder}>No special tips for this day.</p>
        )}
      </section>
    </div>
  );
}

function normalizeRulePlan(plan: RulePlan): NotebookDay[] {
  return (plan.days || []).map((day, idx) => {
    const yogaActivity = day.activities?.find((act) => act.type === "movement" || act.type === "yoga");
    const exerciseActivities = (day.activities || []).filter(
      (act) => act.type === "habit" || act.type === "movement" || act.type === "exercise"
    );

    const meals = (day.meals || []).map((meal) => ({
      title: `${meal.type}: ${meal.name}`,
      portion: `${meal.calories} kcal`,
      recipe: [meal.description || "Enjoy mindfully."],
    }));

    return {
      dayNumber: idx + 1,
      dateLabel: new Date(day.date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      yoga: yogaActivity
        ? {
            title: yogaActivity.name,
            duration: `${yogaActivity.duration} min`,
            steps: [yogaActivity.description],
          }
        : null,
      exercise: exerciseActivities.map((act) => ({
        name: act.name,
        sets: `${act.duration} minutes`,
        cues: act.description,
      })),
      meals,
      tips: ["Hydrate regularly", "Track how you feel", "Stretch gently before sleep"],
    };
  });
}

function normalizeCustomPlan(schedule: WeeklySchedule): NotebookDay[] {
  const days: NotebookDay[] = [];
  const order: (keyof WeeklySchedule)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  order.forEach((key, idx) => {
    const dayPlan = schedule[key];
    if (!dayPlan) return;
    days.push({
      dayNumber: idx + 1,
      dateLabel: key.charAt(0).toUpperCase() + key.slice(1),
      yoga: normalizeYoga(dayPlan),
      exercise: normalizeExercise(dayPlan),
      meals: normalizeMeals(dayPlan),
      tips: normalizeTips(dayPlan),
    });
  });

  return days;
}

function normalizeYoga(dayPlan: CustomDayPlan): NotebookDay["yoga"] {
  if (!dayPlan?.yoga) return null;
  return {
    title: dayPlan.yoga.focus_area || "Balanced Flow",
    duration: dayPlan.yoga.warmup_min
      ? `${dayPlan.yoga.warmup_min + (dayPlan.yoga.cooldown_min || 0)} min`
      : undefined,
    steps:
      dayPlan.yoga.sequence?.map((pose) => {
        const details = [`${pose.name} – ${pose.duration_min} min`];
        if (pose.focus) details.push(`Focus: ${pose.focus}`);
        if (pose.modifications) details.push(`Modifications: ${pose.modifications}`);
        return details.join(". ");
      }) || [],
    notes: dayPlan.yoga.journal_prompt,
  };
}

function normalizeExercise(dayPlan: CustomDayPlan): NotebookDay["exercise"] {
  if (!dayPlan?.strength && !dayPlan?.cardio) {
    return [];
  }
  const exerciseBlocks: NotebookDay["exercise"] = [];
  const blocks = [dayPlan.strength, dayPlan.cardio].filter(Boolean) as Array<
    NonNullable<CustomDayPlan["strength"]>
  >;
  blocks.forEach((block) => {
    if (Array.isArray(block)) {
      block.forEach((item) =>
        exerciseBlocks.push({
          name: item.name,
          sets: item.sets ? `${item.sets} sets` : undefined,
          cues: item.cues,
          tips: item.tips,
        })
      );
    }
  });
  return exerciseBlocks;
}

function normalizeMeals(dayPlan: CustomDayPlan): NotebookDay["meals"] {
  if (!dayPlan?.nutrition) return [];
  const { meals } = dayPlan.nutrition;
  if (!meals) return [];
  return Object.entries(meals).map(([key, meal]) => ({
    title: `${capitalize(key)}: ${meal?.title || meal?.name || "Meal"}`,
    portion: meal?.portion_guidance,
    recipe: meal?.steps || meal?.instructions || (meal?.notes ? [meal.notes] : []),
  }));
}

function normalizeTips(dayPlan: CustomDayPlan): string[] {
  const tips: string[] = [];
  if (dayPlan?.holistic?.mindfulness) tips.push(`Mindfulness: ${dayPlan.holistic.mindfulness}`);
  if (dayPlan?.holistic?.affirmation) tips.push(`Affirmation: ${dayPlan.holistic.affirmation}`);
  if (dayPlan?.holistic?.sleep) tips.push(`Sleep: ${dayPlan.holistic.sleep}`);
  if (dayPlan?.holistic?.rest_day) tips.push("Rest day – focus on recovery.");
  return tips.length ? tips : ["Stay hydrated and note how you feel today."];
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
