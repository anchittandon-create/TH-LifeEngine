export type ConditionKey = "pcod" | "pregnancy" | "back_pain" | "thyroid" | "diabetes" | "hypertension";

type Severity = "avoid" | "modify" | "monitor";

type ContraRecord = {
  activity: string;
  severity: Severity;
  note: string;
};

const CONTRA_MATRIX: Record<ConditionKey, ContraRecord[]> = {
  pcod: [
    { activity: "inversions_long", severity: "avoid", note: "Avoid prolonged inversions during luteal phase." },
    { activity: "high_intensity_core", severity: "modify", note: "Reduce abdominal strain; prefer low-impact flows." },
  ],
  pregnancy: [
    { activity: "deep_twists", severity: "avoid", note: "Deep twists may compress abdomen." },
    { activity: "prone_positions", severity: "avoid", note: "No prone lying post first trimester." },
    { activity: "hot_yoga", severity: "avoid", note: "Avoid overheating to protect foetus." },
  ],
  back_pain: [
    { activity: "loaded_forward_folds", severity: "avoid", note: "Loaded forward folds aggravate lumbar spine." },
    { activity: "deep_backbends", severity: "monitor", note: "Use props and coach oversight." },
  ],
  thyroid: [
    { activity: "prolonged_shoulderstand", severity: "modify", note: "Limit time in shoulderstands, monitor vitals." },
  ],
  diabetes: [
    { activity: "fasted_high_intensity", severity: "avoid", note: "Risk of hypoglycemia." },
    { activity: "simple_sugar_spikes", severity: "avoid", note: "Prefer low GI meal swaps." },
  ],
  hypertension: [
    { activity: "breath_hold", severity: "avoid", note: "Avoid breath retention that spikes BP." },
    { activity: "heavy_isometrics", severity: "monitor", note: "Monitor BP during isometric holds." },
  ],
};

const FOOD_ALLERGY_MAP: Record<string, string[]> = {
  nuts: ["almond", "walnut", "cashew", "peanut", "pista"],
  dairy: ["milk", "paneer", "cheese", "curd", "yogurt"],
  gluten: ["wheat", "barley", "rye", "atta"],
  soy: ["tofu", "soya", "edamame"],
  seafood: ["fish", "prawn", "shrimp", "crab"],
};

export function getContraindicatedActivities(flags: ConditionKey[]): ContraRecord[] {
  const unique = new Map<string, ContraRecord>();
  flags.forEach((flag) => {
    (CONTRA_MATRIX[flag] ?? []).forEach((record) => {
      if (!unique.has(record.activity)) {
        unique.set(record.activity, record);
      }
    });
  });
  return Array.from(unique.values());
}

export function isFoodAllowed(allergies: string[], itemName: string): boolean {
  const lower = itemName.toLowerCase();
  return !allergies.some((allergy) => {
    const group = FOOD_ALLERGY_MAP[allergy.toLowerCase()];
    if (!group) return lower.includes(allergy.toLowerCase());
    return group.some((alias) => lower.includes(alias));
  });
}
