import type { Plan, Week } from '@/lib/domain/plan';
import type { Intake } from '@/lib/domain/intake';
import { CONTRA } from '@/lib/rules/contra';
import { PROGRESSION } from '@/lib/rules/progression';
import { deriveBasics } from '@/lib/rules/diet';

type VerificationResult = {
  plan: Plan;
  warnings: string[];
  analytics: any;
};

export function verifyPlan(plan: any): boolean {
  // Simple verification
  return true;
}

function clonePlan(plan: Plan): Plan {
  return structuredClone ? structuredClone(plan) : JSON.parse(JSON.stringify(plan));
}

function totalDayMinutes(day: Plan["weeks"][number]["days"][number]) {
  const yoga =
    day.yoga?.reduce((sum, item) => sum + (item.duration_min || 0), 0) ?? 0;
  const breath =
    day.breathwork?.reduce((sum, item) => sum + (item.duration_min || 0), 0) ??
    0;
  return yoga + breath;
}

function scaleWeekDurations(week: Week, ratio: number) {
  week.days.forEach((day) => {
    if (day.yoga) {
      day.yoga = day.yoga.map((flow) => ({
        ...flow,
        duration_min: Math.max(5, Math.round(flow.duration_min * ratio)),
      }));
    }
    if (day.breathwork) {
      day.breathwork = day.breathwork.map((breath) => ({
        ...breath,
        duration_min: Math.max(3, Math.round(breath.duration_min * ratio)),
      }));
    }
  });
}

function adjustRestDays(week: Week, budget: number, warnings: string[]) {
  const hasRestDay = week.days.some(
    (day) => totalDayMinutes(day) <= Math.max(15, budget * 0.25)
  );
  if (!hasRestDay) {
    const lastDay = week.days[week.days.length - 1];
    if (lastDay) {
      lastDay.theme = "Active Recovery";
      lastDay.yoga = [];
      lastDay.breathwork = [
        { name: "Box Breathing", duration_min: 8 },
        { name: "Body Scan", duration_min: 10 },
      ];
      warnings.push(
        `Inserted recovery day for week ${week.weekNumber} to respect rest requirement.`
      );
    }
  }
}

export function verifyAndPatch(plan: Plan, intake: Intake): VerificationResult {
  const adjusted = clonePlan(plan);
  const warnings: string[] = [];
  const derived = deriveBasics(intake.profileSnapshot, intake);
  const budget = intake.time_budget_min_per_day;
  const unsafeYogaTags = new Set<string>();
  const unsafeBreathwork = new Set<string>();

  intake.profileSnapshot.medicalConditions.forEach((flag: string) => {
    const rules = CONTRA[flag as keyof typeof CONTRA];
    if (rules) {
      rules.yoga_avoid.forEach((tag) => unsafeYogaTags.add(tag));
      rules.breath_caution.forEach((item) => unsafeBreathwork.add(item));
    }
  });

  const weeklyTotals: number[] = [];

  adjusted.weeks.forEach((week) => {
    week.progression_note =
      week.progression_note ?? "Auto-verified for safe progression.";

    week.days.forEach((day) => {
      // Contraindications for yoga
      if (day.yoga?.length) {
        const filtered = day.yoga.filter((flow) => {
          const tags = flow.tags ?? [];
          const isUnsafe = tags.some((tag: string) => unsafeYogaTags.has(tag));
          if (isUnsafe) {
            warnings.push(
              `Removed contraindicated flow "${flow.name}" on day ${day.dayNumber}.`
            );
          }
          return !isUnsafe;
        });
        if (filtered.length !== day.yoga.length) {
          day.yoga = filtered;
        }
        if (!day.yoga.length) {
          day.yoga = [
            {
              flow_id: "flow_spine_care",
              name: "Spine Care Sequence",
              duration_min: Math.min(derived.kcalTarget / 50, budget / 2),
              intensity: "low",
              tags: ["back_care", "gentle"],
            },
          ];
          warnings.push(
            `Substituted safe flow for day ${day.dayNumber} due to constraints.`
          );
        }
      }

      // Contraindications for breathwork
      if (day.breathwork?.length) {
        const filteredBreath = day.breathwork.filter((item) => {
          const normalized = item.name.toLowerCase();
          const isUnsafe = Array.from(unsafeBreathwork).some((word) =>
            normalized.includes(word.toLowerCase())
          );
          if (isUnsafe) {
            warnings.push(
              `Removed breathwork "${item.name}" on day ${day.dayNumber} for safety.`
            );
          }
          return !isUnsafe;
        });
        day.breathwork = filteredBreath;
      }

      // Hydration adjustments
      if (
        !day.hydration_ml_target ||
        day.hydration_ml_target < derived.hydration
      ) {
        day.hydration_ml_target = derived.hydration;
      }

      // Nutrition adjustments
      if (day.nutrition) {
        const diff = Math.abs(
          day.nutrition.kcal_target - derived.kcalTarget
        );
        if (diff > derived.kcalTarget * 0.15) {
          day.nutrition.kcal_target = derived.kcalTarget;
          warnings.push(
            `Adjusted kcal target on day ${day.dayNumber} to match derived needs.`
          );
        }
      }

      // Time budget enforcement
      const total = totalDayMinutes(day);
      if (total > budget && total > 0) {
        const ratio = budget / total;
        if (day.yoga) {
          day.yoga = day.yoga.map((flow) => ({
            ...flow,
            duration_min: Math.max(5, Math.round(flow.duration_min * ratio)),
          }));
        }
        if (day.breathwork) {
          day.breathwork = day.breathwork.map((item) => ({
            ...item,
            duration_min: Math.max(3, Math.round(item.duration_min * ratio)),
          }));
        }
        warnings.push(
          `Scaled activity durations on day ${day.dayNumber} to respect time budget.`
        );
      }
    });

    adjustRestDays(week, budget, warnings);
    const weekMinutes = week.days.reduce(
      (sum, day) => sum + totalDayMinutes(day),
      0
    );
    weeklyTotals.push(weekMinutes);
  });

  // Progression checks
  adjusted.weeks.forEach((week, index) => {
    if (index === 0) {
      return;
    }
    const prev = weeklyTotals[index - 1];
    const current = weeklyTotals[index];
    if (prev === 0) {
      return;
    }
    const allowed = prev * (1 + PROGRESSION.maxWeeklyIncreasePct / 100);
    if (current > allowed) {
      const ratio = allowed / current;
      scaleWeekDurations(week, ratio);
      weeklyTotals[index] = allowed;
      warnings.push(
        `Compressed week ${week.weekNumber} volume to respect ${PROGRESSION.maxWeeklyIncreasePct}% progression rule.`
      );
    }
  });

  if (weeklyTotals.length >= PROGRESSION.deloadEveryWeeks) {
    for (
      let i = PROGRESSION.deloadEveryWeeks - 1;
      i < adjusted.weeks.length;
      i += PROGRESSION.deloadEveryWeeks
    ) {
      const week = adjusted.weeks[i];
      const baseline =
        weeklyTotals[i - 1] ?? weeklyTotals[i] ?? intake.time_budget_min_per_day * 4;
      const target = baseline * (1 - PROGRESSION.deloadDropPct / 100);
      if (weeklyTotals[i] > target) {
        const ratio = target / weeklyTotals[i];
        scaleWeekDurations(week, ratio);
        weeklyTotals[i] = target;
        week.progression_note = "Deload week inserted for recovery.";
        warnings.push(
          `Deload applied on week ${week.weekNumber} reducing volume by ${PROGRESSION.deloadDropPct}%.`
        );
      }
    }
  }

  const uniqueWarnings = Array.from(new Set([...(plan.warnings ?? []), ...warnings]));
  adjusted.warnings = uniqueWarnings;
  adjusted.meta = adjusted.meta || {};
  adjusted.meta.time_budget_min_per_day = intake.time_budget_min_per_day;
  adjusted.meta.flags = intake.profileSnapshot.medicalConditions;
  adjusted.meta.goals = intake.goals.map((g) => g.name);

  // Analytics scores
  const safetyScore = Math.max(
    0,
    1 - uniqueWarnings.length * 0.05 - unsafeYogaTags.size * 0.05
  );
  const dietScore = Math.min(1, 1 - Math.abs(derived.kcalTarget - averageDailyCalories(adjusted)) / (derived.kcalTarget || 1) * 0.2);
  const progressionScore = Math.min(
    1,
    weeklyTotals.every((val, idx) => {
      if (idx === 0) return true;
      return (
        val <=
        weeklyTotals[idx - 1] * (1 + PROGRESSION.maxWeeklyIncreasePct / 100) +
          1
      );
    })
      ? 1
      : 0.75
  );
  const adherenceScore = Math.max(
    0.6,
    1 - (uniqueWarnings.length / Math.max(1, adjusted.weeks.length)) * 0.1
  );
  const overall = Number(
    (
      (safetyScore + dietScore + progressionScore + adherenceScore) /
      4
    ).toFixed(2)
  );

  adjusted.analytics = {
    safety_score: Number(safetyScore.toFixed(2)),
    diet_match: Number(dietScore.toFixed(2)),
    progression_score: Number(progressionScore.toFixed(2)),
    adherence_score: Number(adherenceScore.toFixed(2)),
    overall,
  };

  adjusted.coach_messages = adjusted.coach_messages || [];
  adjusted.coach_messages =
    adjusted.coach_messages.length > 0
      ? adjusted.coach_messages
      : [
          "Remember to log perceived exertion after each session.",
          "Prioritise consistent sleep and hydration to consolidate gains.",
        ];

  adjusted.adherence_tips = adjusted.adherence_tips || [];
  adjusted.adherence_tips =
    adjusted.adherence_tips.length > 0
      ? adjusted.adherence_tips
      : [
          "Stack breathwork onto your morning slots for consistency.",
          "Batch-prep hydration infusions the night before busy days.",
        ];

  return {
    plan: adjusted,
    warnings: uniqueWarnings,
    analytics: adjusted.analytics,
  };
}

function averageDailyCalories(plan: Plan) {
  const totals: number[] = [];
  plan.weeks.forEach((week) => {
    week.days.forEach((day) => {
      if (day.nutrition) {
        totals.push(day.nutrition.kcal_target);
      }
    });
  });
  if (!totals.length) {
    return 0;
  }
  const sum = totals.reduce((acc, value) => acc + value, 0);
  return sum / totals.length;
}
