import { Profile, Intake } from '../ai/schemas';

export interface NutritionTargets {
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  hydrationMl: number;
}

export function calculateBMR(profile: Profile): number {
  // Mifflin-St Jeor Equation
  if (profile.gender === 'male') {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.2);
}

export function calculateCalories(profile: Profile, goal: string): number {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  if (goal.includes('weight_loss')) {
    return Math.max(tdee - 500, bmr * 1.2); // Don't go below sedentary maintenance
  } else if (goal.includes('weight_gain')) {
    return tdee + 300;
  } else if (goal.includes('muscle_gain')) {
    return tdee + 200;
  }
  return tdee; // maintenance
}

export function calculateMacronutrients(calories: number, goal: string): { protein: number; carbs: number; fat: number } {
  let proteinPct = 0.25; // 25% protein
  let fatPct = 0.25; // 25% fat
  let carbsPct = 0.5; // 50% carbs

  if (goal.includes('muscle_gain')) {
    proteinPct = 0.3;
    carbsPct = 0.5;
    fatPct = 0.2;
  } else if (goal.includes('weight_loss')) {
    proteinPct = 0.35;
    carbsPct = 0.4;
    fatPct = 0.25;
  }

  return {
    protein: (calories * proteinPct) / 4, // 4 cal per gram
    carbs: (calories * carbsPct) / 4, // 4 cal per gram
    fat: (calories * fatPct) / 9, // 9 cal per gram
  };
}

export function calculateHydration(profile: Profile): number {
  // General guideline: 30-35ml per kg body weight
  const baseHydration = profile.weight * 33;

  // Adjust for activity level
  const activityMultiplier = {
    sedentary: 1.0,
    light: 1.1,
    moderate: 1.2,
    active: 1.3,
    very_active: 1.4,
  };

  return baseHydration * (activityMultiplier[profile.activityLevel as keyof typeof activityMultiplier] || 1.0);
}

export function deriveNutritionTargets(profile: Profile, intake: Intake): NutritionTargets {
  const dailyCalories = calculateCalories(profile, intake.primaryPlanType);
  const macros = calculateMacronutrients(dailyCalories, intake.primaryPlanType);
  const hydrationMl = calculateHydration(profile);

  return {
    dailyCalories,
    proteinGrams: Math.round(macros.protein),
    carbsGrams: Math.round(macros.carbs),
    fatGrams: Math.round(macros.fat),
    hydrationMl: Math.round(hydrationMl),
  };
}