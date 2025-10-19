type RawPlan = any;

type NormalizedMeal = {
  meal: string;
  catalog_id: string;
  name: string;
  swap_suggestions: string[];
};

type NormalizedDay = {
  day_index: number;
  theme: string;
  yoga: Array<{ name: string; duration_min: number }>;
  breath_mindfulness: Array<{ name: string; duration_min: number }>;
  habit_tasks: string[];
  nutrition: { kcal_target: number; meals: NormalizedMeal[] };
  hydration_ml_target: number;
  sleep: { wind_down_min: number; tip: string };
  notes: string;
};

export type NormalizedWeek = {
  week_index: number;
  focus: string;
  progression_note: string;
  days: NormalizedDay[];
};

export type NormalizedPlan = {
  meta: {
    title: string;
    duration_days: number;
    weeks: number;
    goals: string[];
    flags: string[];
    dietary: { type: string; allergies: string[]; cuisine_pref: string };
    time_budget_min_per_day: number;
    notes: string;
  };
  weeks: NormalizedWeek[];
  safetyWarnings: string[];
  adherenceTips: string[];
};

function asNumber(value: any, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function buildWeeksFromDays(days: any[]): NormalizedWeek[] {
  if (!Array.isArray(days) || !days.length) return [];
  const weeks: NormalizedWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const slice = days.slice(i, i + 7);
    weeks.push({
      week_index: weeks.length + 1,
      focus: "Weekly schedule",
      progression_note: "Maintain consistency",
      days: slice.map((day: any, idx: number) => {
        const yoga = Array.isArray(day?.yoga)
          ? day.yoga.map((flow: any) => ({
              name: flow?.name ?? flow?.flowId ?? "Flow",
              duration_min: asNumber(flow?.duration_min ?? flow?.durationMin, 0),
            }))
          : [];
        const mealsSource = day?.nutrition?.meals ?? day?.meals ?? [];
        const meals: NormalizedMeal[] = Array.isArray(mealsSource)
          ? mealsSource.map((meal: any) => ({
              meal: meal?.meal ?? "meal",
              catalog_id: meal?.catalog_id ?? meal?.itemId ?? "TBD",
              name: meal?.name ?? meal?.itemId ?? "Meal",
              swap_suggestions: Array.isArray(meal?.swap_suggestions)
                ? meal.swap_suggestions
                : ["dal+salad", "paneer+salad"],
            }))
          : [];

        return {
          day_index: idx + 1,
          theme: day?.theme ?? (day?.habits?.length ? "Habits & Recovery" : "Balanced Flow"),
          yoga,
          breath_mindfulness: Array.isArray(day?.breath_mindfulness)
            ? day.breath_mindfulness.map((b: any) => ({
                name: b?.name ?? "Breathwork",
                duration_min: asNumber(b?.duration_min ?? b?.durationMin, 5),
              }))
            : [],
          habit_tasks: Array.isArray(day?.habit_tasks) ? day.habit_tasks : day?.habits ?? [],
          nutrition: {
            kcal_target: asNumber(day?.nutrition?.kcal_target, 0),
            meals,
          },
          hydration_ml_target: asNumber(day?.hydration_ml_target, 2000),
          sleep: {
            wind_down_min: asNumber(day?.sleep?.wind_down_min ?? day?.sleep?.windDownMin, 20),
            tip: day?.sleep?.tip ?? "Maintain a consistent bedtime routine.",
          },
          notes: day?.notes ?? "",
        };
      }),
    });
  }
  return weeks;
}

export function normalizePlanStructure(planId: string, planJSON: RawPlan, warnings: string[] = []): NormalizedPlan {
  const metaSource = planJSON?.meta ?? {};
  const rawWeeks = Array.isArray(planJSON?.weekly_plan) ? planJSON.weekly_plan : [];
  const weeks = rawWeeks.length ? rawWeeks : buildWeeksFromDays(planJSON?.days ?? []);
  const durationDays = metaSource.duration_days ?? (planJSON?.days?.length ?? weeks.length * 7);

  return {
    meta: {
      title: metaSource.title ?? planJSON?.id ?? planId,
      duration_days: durationDays,
      weeks: metaSource.weeks ?? weeks.length,
      goals: metaSource.goals ?? [],
      flags: metaSource.flags ?? warnings,
      dietary: metaSource.dietary ?? { type: "", allergies: [], cuisine_pref: "" },
      time_budget_min_per_day: metaSource.time_budget_min_per_day ?? 0,
      notes: metaSource.notes ?? "",
    },
    weeks,
    safetyWarnings: planJSON?.safety_warnings ?? [],
    adherenceTips: planJSON?.adherence_tips ?? [],
  };
}
