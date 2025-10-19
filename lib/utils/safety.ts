// This file contains the safety matrices for the LifeEngine application.
// It is used to check for contraindications between a user's health flags
// and the yoga poses or food items included in their plan.

// Note: This is a simplified representation. In a real-world application,
// this data would likely be stored in a database and managed by a team
// of health and wellness experts.

export const yogaContraindications: Record<string, string[]> = {
  pregnancy: ["deep_twists", "belly_down_poses", "intense_core_work"],
  hypertension: ["inversions", "breath_retention"],
  back_pain: ["deep_forward_folds", "unsupported_backbends"],
  diabetes: ["prolonged_inversions"],
  thyroid: ["shoulder_stand", "plow_pose"],
};

export const nutritionContraindications: Record<string, string[]> = {
  diabetes: ["high_glycemic_foods", "sugary_drinks"],
  hypertension: ["high_sodium_foods"],
  pcod: ["refined_carbs", "sugary_foods"],
  thyroid: ["goitrogenic_foods_raw"], // e.g., raw cabbage, kale, soy
};
