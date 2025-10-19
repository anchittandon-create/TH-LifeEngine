export const CONTRA = {
  pcod: {
    yoga_avoid: ["prolonged_inversions"],
    breath_caution: [],
    diet_notes: ["prefer_low_gi", "anti_inflammatory"],
  },
  pregnancy: {
    yoga_avoid: ["deep_twists", "hot_yoga"],
    breath_caution: ["long_breath_retention"],
    diet_notes: ["high_fiber", "avoid_unpasteurized"],
  },
  back_pain: {
    yoga_avoid: ["deep_forward_flexion"],
    breath_caution: [],
    diet_notes: [],
  },
  hypertension: {
    yoga_avoid: ["forceful_breath", "max_exertion_flows"],
    breath_caution: ["kapalbhati"],
    diet_notes: ["low_sodium"],
  },
} as const;
