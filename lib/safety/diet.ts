import { Profile, GoalType, deriveCalorieTarget, computeHydrationTargetMl } from "@/lib/domain/profile";

type MacroSplit = {
  protein_pct: number;
  carbs_pct: number;
  fats_pct: number;
};

const GOAL_MACROS: Record<GoalType, MacroSplit> = {
  fat_loss: { protein_pct: 0.35, carbs_pct: 0.35, fats_pct: 0.3 },
  lean_gain: { protein_pct: 0.3, carbs_pct: 0.45, fats_pct: 0.25 },
  maintenance: { protein_pct: 0.25, carbs_pct: 0.45, fats_pct: 0.3 },
  pcod_remission: { protein_pct: 0.3, carbs_pct: 0.4, fats_pct: 0.3 },
  stress_balance: { protein_pct: 0.25, carbs_pct: 0.45, fats_pct: 0.3 },
};

export function computeNutritionTargets(profile: Profile, goal: GoalType) {
  const kcal = deriveCalorieTarget(profile, goal);
  const split = GOAL_MACROS[goal] ?? GOAL_MACROS.maintenance;
  return {
    kcal,
    macros: {
      protein_g: Math.round(((kcal * split.protein_pct) / 4) * 10) / 10,
      carbs_g: Math.round(((kcal * split.carbs_pct) / 4) * 10) / 10,
      fats_g: Math.round(((kcal * split.fats_pct) / 9) * 10) / 10,
    },
    hydration_ml: computeHydrationTargetMl(profile),
  };
}

export function clampDailyTime(allocation: number, limit: number): number {
  return Math.min(allocation, limit);
}
