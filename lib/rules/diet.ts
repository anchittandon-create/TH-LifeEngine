export function calculateDiet(plan: any) {
  return {
    dailyCalories: 2000,
    proteinGrams: 150,
    carbsGrams: 250,
    fatGrams: 67,
    hydrationMl: 3000,
  };
}

export function deriveNutritionTargets(profile: any, intake: any) {
  return calculateDiet({ profile, intake });
}