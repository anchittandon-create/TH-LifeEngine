export type Sex = "F" | "M" | "Other";

type BmrParams = {
  weight: number; // kg
  height: number; // cm
  age: number; // years
  sex: Sex;
};

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 */
export function calculateBmr({ weight, height, age, sex }: BmrParams): number {
  if (sex === "M") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  if (sex === "F") {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  // For "Other", we can average the two, or use a neutral value.
  // Averaging is a reasonable approach.
  const bmrM = 10 * weight + 6.25 * height - 5 * age + 5;
  const bmrF = 10 * weight + 6.25 * height - 5 * age - 161;
  return (bmrM + bmrF) / 2;
}

const activityFactors: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 */
export function calculateTdee(bmr: number, activityLevel: string): number {
  const factor = activityFactors[activityLevel.toLowerCase()] || 1.2;
  return bmr * factor;
}
