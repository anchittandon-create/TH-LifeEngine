"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import PlanPreview from "@/app/components/PlanPreview";
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
      const customDays = normalizeCustomPlan(customPlan.weekly_schedule);
      if (customDays.length) {
        return customDays;
      }
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

  const loadPlan = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      // Try the new API format first (Gemini plans)
      const detailRes = await fetch(`/api/lifeengine/plan/detail?planId=${params.id}`);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        
        // Check if it's a custom GPT plan (has weekly_schedule)
        if (detailData.plan?.weekly_schedule) {
          console.log('✅ Loaded Custom GPT plan');
          setCustomPlan(detailData.plan as LifeEnginePlan);
          setRulePlan(null);
          return;
        }
        
        // Check if it's a Gemini plan (has days array)
        if (detailData.plan?.days) {
          console.log('✅ Loaded Gemini plan');
          setRulePlan(detailData.plan as RulePlan);
          setCustomPlan(null);
          return;
        }
      }
      
      // Fallback to old API
      console.log('Trying fallback API...');
      const response = await fetch(`/api/lifeengine/getPlan?id=${params.id}`);
      if (!response.ok) {
        // If plan not found and this is a recent generation, retry
        if (response.status === 404 && retryCount < 3) {
          console.log(`Plan not found yet, retrying in ${(retryCount + 1) * 500}ms... (attempt ${retryCount + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
          return loadPlan(retryCount + 1);
        }
        throw new Error("Failed to load plan");
      }
      
      const data = await response.json();
      console.log('✅ Loaded plan from fallback API');
      setRulePlan(data.plan);
      setCustomPlan(null);
    } catch (err: any) {
      console.error('❌ Failed to load plan:', err);
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
            <Button onClick={() => loadPlan()}>Try Again</Button>
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
    const exerciseActivities = (day.activities || []).filter((act) =>
      ["habit", "movement", "exercise"].includes(act.type)
    );

    const meals = (day.meals || []).map((meal) => ({
      title: `${capitalize(meal.type)}: ${meal.name}`,
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
            steps: yogaActivity.description ? [yogaActivity.description] : ["Gentle flow and breathwork."],
          }
        : null,
      exercise: exerciseActivities.map((act) => ({
        name: act.name,
        sets: `${act.duration} min`,
        cues: act.description,
      })),
      meals,
      tips: ["Hydrate regularly", "Track how you feel", "Stretch gently before sleep"],
    };
  });
}

function normalizeCustomPlan(schedule: WeeklySchedule): NotebookDay[] {
  const orderedKeys: (keyof WeeklySchedule)[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const days: NotebookDay[] = [];

  orderedKeys.forEach((key) => {
    const dayPlan = schedule[key];
    if (!dayPlan) return;
    days.push({
      dayNumber: days.length + 1,
      dateLabel: capitalize(key),
      yoga: normalizeYoga(dayPlan),
      exercise: normalizeExercises(dayPlan),
      meals: normalizeMeals(dayPlan),
      tips: normalizeTips(dayPlan),
    });
  });

  return days;
}

function normalizeYoga(dayPlan: CustomDayPlan): NotebookDay["yoga"] {
  const session = dayPlan?.yoga;
  if (!session) return null;

  const steps =
    session.sequence?.map((pose) => {
      const parts: string[] = [];
      parts.push(`${pose.name}${pose.duration_min ? ` – ${pose.duration_min} min` : ""}`);
      if (pose.steps?.length) {
        parts.push(...pose.steps);
      }
      if (pose.breathing_instructions) {
        parts.push(`Breathing: ${pose.breathing_instructions}`);
      }
      if (pose.benefits) {
        parts.push(`Benefits: ${pose.benefits}`);
      }
      if (pose.modifications) {
        parts.push(`Modifications: ${pose.modifications}`);
      }
      return parts.join(" · ");
    }) ?? ["Gentle flow focused on mindful breathing."];

  return {
    title: session.focus_area || "Balanced Flow",
    duration:
      session.warmup_min || session.cooldown_min
        ? `${(session.warmup_min ?? 0) + (session.cooldown_min ?? 0)} min`
        : undefined,
    steps,
    notes: session.journal_prompt || session.breathwork || undefined,
  };
}

function normalizeExercises(dayPlan: CustomDayPlan): NotebookDay["exercise"] {
  if (!Array.isArray(dayPlan?.exercises) || !dayPlan.exercises.length) {
    return [];
  }

  return dayPlan.exercises.map((exercise) => {
    const setsReps =
      exercise.sets && exercise.reps
        ? `${exercise.sets} × ${typeof exercise.reps === "number" ? `${exercise.reps} reps` : exercise.reps}`
        : undefined;
    const duration = exercise.duration_min ? `${exercise.duration_min} min` : undefined;
    const cues = exercise.steps?.length
      ? exercise.steps.join(" → ")
      : exercise.description || exercise.type || "";
    const tips = exercise.form_cues?.length
      ? `Form: ${exercise.form_cues.join(" • ")}`
      : exercise.common_mistakes?.length
      ? `Avoid: ${exercise.common_mistakes.join(" • ")}`
      : exercise.progressions || exercise.regressions || undefined;

    return {
      name: exercise.name,
      sets: setsReps || duration,
      cues,
      tips,
    };
  });
}

function normalizeMeals(dayPlan: CustomDayPlan): NotebookDay["meals"] {
  const diet = (dayPlan as any).diet ?? (dayPlan as any).nutrition;
  if (!diet) return [];

  const meals: NotebookDay["meals"] = [];
  const addMeal = (label: string, meal: any) => {
    if (!meal) return;
    meals.push({
      title: `${label}: ${meal.title || meal.name || "Meal"}`,
      portion: meal.portion_guidance || meal.portions,
      recipe: collectRecipeSteps(meal),
    });
  };

  addMeal("Breakfast", diet.breakfast);
  addMeal("Lunch", diet.lunch);
  addMeal("Dinner", diet.dinner);

  if (Array.isArray(diet.snacks)) {
    diet.snacks.forEach((snack: any, index: number) => addMeal(`Snack ${index + 1}`, snack));
  }

  if (diet.evening_tea) {
    addMeal("Evening Tea", diet.evening_tea);
  }

  return meals;
}

function collectRecipeSteps(meal: any): string[] {
  if (Array.isArray(meal?.recipe_steps) && meal.recipe_steps.length) {
    return meal.recipe_steps;
  }
  if (Array.isArray(meal?.steps) && meal.steps.length) {
    return meal.steps;
  }
  if (Array.isArray(meal?.instructions) && meal.instructions.length) {
    return meal.instructions;
  }
  if (Array.isArray(meal?.ingredients) && meal.ingredients.length) {
    return meal.ingredients;
  }
  if (meal?.notes) {
    return [meal.notes];
  }
  return ["Follow intuitive cooking cues based on ingredients provided."];
}

function normalizeTips(dayPlan: CustomDayPlan): string[] {
  const tips: string[] = [];

  if (dayPlan?.holistic?.mindfulness) {
    tips.push(`Mindfulness: ${dayPlan.holistic.mindfulness}`);
  }
  if (dayPlan?.holistic?.affirmation) {
    tips.push(`Affirmation: ${dayPlan.holistic.affirmation}`);
  }
  if (dayPlan?.holistic?.sleep) {
    tips.push(`Sleep Focus: ${dayPlan.holistic.sleep}`);
  }
  if (dayPlan?.holistic?.rest_day) {
    tips.push("Rest day – prioritize gentle movement and reflection.");
  }
  if (dayPlan?.yoga?.journal_prompt) {
    tips.push(`Journal: ${dayPlan.yoga.journal_prompt}`);
  }
  const dietNotes = (dayPlan as any)?.diet?.notes || (dayPlan as any)?.nutrition?.notes;
  if (dietNotes) {
    tips.push(`Nutrition Tip: ${dietNotes}`);
  }

  return tips.length ? tips : ["Stay hydrated and note how you feel today."];
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
