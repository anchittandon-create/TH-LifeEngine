export const PLAN_TYPE_OPTIONS = [
  { label: "Yoga Optimization", value: "yoga" },
  { label: "Diet & Nutrition", value: "diet" },
  { label: "Combined (Movement + Diet)", value: "combined" },
  { label: "Holistic Lifestyle Reset", value: "holistic" },
  { label: "Strength & Conditioning", value: "strength" },
  { label: "Mobility & Recovery", value: "mobility" },
  { label: "Stress & Sleep Reset", value: "stress_relief" },
  { label: "Prenatal / Postnatal Care", value: "prenatal" },
] as const;

export const DURATION_OPTIONS = [
  { label: "1 Month (4 Weeks)", value: "1" },
  { label: "2 Months (8 Weeks)", value: "2" },
  { label: "3 Months (12 Weeks)", value: "3" },
  { label: "6 Months (24 Weeks)", value: "6" },
  { label: "12 Months (1 Year)", value: "12" },
] as const;

export const INTENSITY_OPTIONS = [
  { label: "Regenerative (Low)", value: "Low" },
  { label: "Balanced (Medium)", value: "Medium" },
  { label: "Athletic (High)", value: "High" },
] as const;

export const FORMAT_OPTIONS = [
  { label: "Text Summary", value: "text" },
  { label: "Downloadable PDF", value: "pdf" },
  { label: "Text + PDF", value: "both" },
] as const;

export const FOCUS_AREA_OPTIONS = [
  "Metabolic health",
  "Hormone balance",
  "Stress resilience",
  "Mobility & flexibility",
  "Posture & spine",
  "Gut health",
  "Sleep quality",
  "Strength & conditioning",
  "Weight management",
  "Energy & focus",
  "Cardio endurance",
  "Mindfulness & breath",
  "Immune resilience",
  "Bone density",
] as const;

export const ROUTINE_OPTIONS = [
  { label: "Yes – include daily routines", value: "yes" },
  { label: "No – skip daily routines", value: "no" },
] as const;

export const GOAL_OPTIONS = [
  "Weight loss",
  "Muscle gain",
  "Stress reduction",
  "Sleep optimization",
  "Metabolic reset",
  "Hormone balance",
  "Endurance boost",
  "Posture correction",
] as const;

export const DIET_OPTIONS = [
  "vegetarian",
  "vegan",
  "eggetarian",
  "non_veg",
  "jain",
  "gluten_free",
  "lactose_free",
] as const;

export const ACTIVITY_LEVEL_OPTIONS = [
  "sedentary",
  "light",
  "moderate",
  "intense",
] as const;

export const CHRONIC_CONDITION_OPTIONS = [
  "PCOS",
  "Hypertension",
  "Diabetes",
  "Thyroid",
  "Anxiety",
  "Back pain",
  "None",
] as const;

export type PlanFormState = {
  planTypes: string[];
  duration: string;
  intensity: string;
  focusAreas: string[];
  format: string;
  includeDailyRoutine: string;
  goals: string[];
  dietType: string;
  activityLevel: string;
  chronicConditions: string[];
  sleepHours: string;
  stressLevel: string;
};

export const defaultPlanFormState: PlanFormState = {
  planTypes: [PLAN_TYPE_OPTIONS[0].value],
  duration: DURATION_OPTIONS[0].value,
  intensity: INTENSITY_OPTIONS[1].value,
  focusAreas: [],
  format: FORMAT_OPTIONS[0].value,
  includeDailyRoutine: ROUTINE_OPTIONS[0].value,
  goals: [],
  dietType: DIET_OPTIONS[0],
  activityLevel: ACTIVITY_LEVEL_OPTIONS[2],
  chronicConditions: [],
  sleepHours: "7",
  stressLevel: "medium",
};

export function buildIntakeFromForm(form: PlanFormState, overridePlanType?: string) {
  const durationMonths = Number(form.duration) || 1;
  const now = Date.now();
  const end = new Date(now + durationMonths * 30 * 24 * 60 * 60 * 1000);
  const planType = overridePlanType ?? form.planTypes[0] ?? PLAN_TYPE_OPTIONS[0].value;

  return {
    primaryPlanType: planType,
    secondaryPlanType: "",
    startDate: new Date(now).toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    preferences: {
      intensity: form.intensity,
      focusAreas: form.focusAreas,
      format: form.format,
      includeDailyRoutine: form.includeDailyRoutine === "yes",
    },
  };
}

export function describePlanBrief(profileId: string, form: PlanFormState) {
  const planTypes = form.planTypes.length ? form.planTypes : [PLAN_TYPE_OPTIONS[0].value];
  return [
    `profile_id: ${profileId}`,
    `plan_types: ${planTypes.join(", ")}`,
    `duration_months: ${form.duration}`,
    `intensity: ${form.intensity}`,
    `focus_areas: ${form.focusAreas.length ? form.focusAreas.join(", ") : "coach to determine"}`,
    `output_format: ${form.format}`,
    `include_daily_routine: ${form.includeDailyRoutine === "yes" ? "yes" : "no"}`,
    `goals: ${form.goals.length ? form.goals.join(", ") : "not specified"}`,
    `diet_type: ${form.dietType}`,
    `activity_level: ${form.activityLevel}`,
    `chronic_conditions: ${form.chronicConditions.length ? form.chronicConditions.join(", ") : "none reported"}`,
    `sleep_hours: ${form.sleepHours}`,
    `stress_level: ${form.stressLevel}`,
  ].join("\n");
}
