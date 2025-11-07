export const PLAN_TYPE_OPTIONS = [
  { label: "Yoga Optimization", value: "yoga" },
  { label: "Diet & Nutrition", value: "diet" },
  { label: "Combined (Movement + Diet)", value: "combined" },
  { label: "Holistic Lifestyle Reset", value: "holistic" },
] as const;

export const DURATION_OPTIONS = [
  { label: "4 Weeks", value: "1" },
  { label: "8 Weeks", value: "2" },
  { label: "12 Weeks", value: "3" },
  { label: "24 Weeks", value: "6" },
  { label: "1 Year", value: "12" },
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
] as const;

export const ROUTINE_OPTIONS = [
  { label: "Yes – include daily routines", value: "yes" },
  { label: "No – skip daily routines", value: "no" },
] as const;

export type PlanFormState = {
  planType: string;
  duration: string;
  intensity: string;
  focusAreas: string[];
  format: string;
  includeDailyRoutine: string;
};

export const defaultPlanFormState: PlanFormState = {
  planType: PLAN_TYPE_OPTIONS[0].value,
  duration: DURATION_OPTIONS[0].value,
  intensity: INTENSITY_OPTIONS[1].value,
  focusAreas: [],
  format: FORMAT_OPTIONS[0].value,
  includeDailyRoutine: ROUTINE_OPTIONS[0].value,
};

export function buildIntakeFromForm(form: PlanFormState) {
  const durationMonths = Number(form.duration) || 1;
  const now = Date.now();
  const end = new Date(now + durationMonths * 30 * 24 * 60 * 60 * 1000);

  return {
    primaryPlanType: form.planType,
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
  return [
    `profile_id: ${profileId}`,
    `plan_type: ${form.planType}`,
    `duration_months: ${form.duration}`,
    `intensity: ${form.intensity}`,
    `focus_areas: ${form.focusAreas.length ? form.focusAreas.join(", ") : "coach to determine"}`,
    `output_format: ${form.format}`,
    `include_daily_routine: ${form.includeDailyRoutine === "yes" ? "yes" : "no"}`,
  ].join("\n");
}
