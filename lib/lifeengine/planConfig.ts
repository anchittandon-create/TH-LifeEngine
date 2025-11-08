export const PLAN_TYPE_OPTIONS = [
  { label: "Yoga & Flexibility", value: "yoga" },
  { label: "Fitness & Strength Training", value: "fitness" },
  { label: "Diet & Nutrition", value: "diet" },
  { label: "Mental Health & Mindfulness", value: "mental_health" },
  { label: "Sleep Hygiene & Recovery", value: "sleep" },
  { label: "Weight Loss Program", value: "weight_loss" },
  { label: "Muscle Building", value: "muscle_building" },
  { label: "Cardio & Endurance", value: "cardio" },
  { label: "HIIT Training", value: "hiit" },
  { label: "Pilates", value: "pilates" },
  { label: "Meditation & Breathwork", value: "meditation" },
  { label: "Stress Management", value: "stress_management" },
  { label: "Prenatal / Postnatal Care", value: "prenatal" },
  { label: "Senior Wellness", value: "senior" },
  { label: "Sports Performance", value: "sports" },
  { label: "Rehabilitation & Recovery", value: "rehab" },
  { label: "Holistic Wellness", value: "holistic" },
  { label: "Metabolic Health", value: "metabolic" },
  { label: "Hormone Balance", value: "hormone" },
  { label: "Gut Health", value: "gut_health" },
  { label: "Immune Boost", value: "immune" },
  { label: "Detox Program", value: "detox" },
  { label: "Anti-Aging", value: "anti_aging" },
  { label: "Chronic Disease Management", value: "chronic_disease" },
  { label: "Combined (Multiple Focus)", value: "combined" },
] as const;

export const DURATION_OPTIONS = [
  { label: "7 Days (Jumpstart)", value: "7_days" },
  { label: "14 Days (Quick Reset)", value: "14_days" },
  { label: "28 Days (4 Weeks)", value: "28_days" },
  { label: "60 Days (8 Weeks)", value: "60_days" },
  { label: "90 Days (12 Weeks)", value: "90_days" },
] as const;

export const INTENSITY_OPTIONS = [
  { label: "Regenerative (Low)", value: "low" },
  { label: "Balanced (Moderate)", value: "moderate" },
  { label: "Athletic (High)", value: "high" },
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
  "Hormonal balance",
  "Gut & digestion",
  "Joint longevity",
] as const;

export const ROUTINE_OPTIONS = [
  { label: "Yes – include daily routines", value: "yes" },
  { label: "No – skip daily routines", value: "no" },
] as const;

export const GOAL_OPTIONS = [
  "Weight loss",
  "Fat loss",
  "Muscle gain",
  "Strength building",
  "Flexibility improvement",
  "Stress reduction",
  "Stress relief",
  "Better sleep",
  "Sleep optimization",
  "Energy boost",
  "Immunity boost",
  "PCOS management",
  "Diabetes management",
  "Heart health",
  "Blood pressure control",
  "Metabolic reset",
  "Hormone balance",
  "Endurance boost",
  "Posture correction",
  "Flexibility & mobility",
  "Anxiety management",
  "Mental clarity",
  "Depression relief",
  "Chronic pain management",
  "Back pain relief",
  "Joint health",
  "Bone density",
  "Gut health",
  "Digestive wellness",
  "Skin health",
  "Hair health",
  "Anti-aging",
  "Detoxification",
  "Inflammation reduction",
  "Athletic performance",
  "Body toning",
  "Core strength",
  "Balance improvement",
  "Respiratory health",
  "Cardiovascular fitness",
  "Recovery & healing",
  "Prenatal wellness",
  "Postnatal recovery",
  "Menopause support",
  "Thyroid health",
  "Liver health",
  "Kidney health",
  "Cholesterol management",
  "Blood sugar control",
] as const;

export const DIET_OPTIONS = [
  "veg",
  "vegan",
  "eggetarian",
  "non_veg",
  "jain",
  "gluten_free",
  "lactose_free",
] as const;

const DIET_LABELS: Record<string, string> = {
  veg: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  non_veg: "Non-Vegetarian",
  jain: "Jain",
  gluten_free: "Gluten Free",
  lactose_free: "Lactose Free",
};

export const ACTIVITY_LEVEL_OPTIONS = [
  "sedentary",
  "light",
  "moderate",
  "intense",
] as const;

export const CHRONIC_CONDITION_OPTIONS = [
  "None",
  "PCOS / PCOD",
  "Type 1 Diabetes",
  "Type 2 Diabetes",
  "Prediabetes",
  "Hypertension / High BP",
  "Low Blood Pressure",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Thyroid disorders",
  "Heart disease",
  "High cholesterol",
  "Asthma",
  "COPD",
  "Arthritis",
  "Osteoporosis",
  "Rheumatoid arthritis",
  "Chronic back pain",
  "Chronic neck pain",
  "Sciatica",
  "Fibromyalgia",
  "Migraine / Chronic headaches",
  "Anxiety disorder",
  "Depression",
  "PTSD",
  "Insomnia",
  "Sleep apnea",
  "IBS / Irritable Bowel Syndrome",
  "Crohn's disease",
  "Ulcerative colitis",
  "Celiac disease",
  "Acid reflux / GERD",
  "Fatty liver disease",
  "Kidney disease",
  "Autoimmune disorders",
  "Lupus",
  "Multiple sclerosis",
  "Psoriasis",
  "Eczema",
  "Endometriosis",
  "Menopause symptoms",
  "Chronic fatigue syndrome",
  "Anemia",
  "Obesity",
  "Eating disorders",
  "Cancer (in remission)",
  "Stroke recovery",
  "Other",
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

export function getDietLabel(value: string) {
  return DIET_LABELS[value] ?? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
