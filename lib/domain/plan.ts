import { z } from "zod";

export const CitationSchema = z.object({
  cardId: z.string().min(1),
  source_url: z.string().url(),
  title: z.string().min(1),
});

export const SleepSchema = z.object({
  wind_down_min: z.number().int().min(10).max(120),
  tip: z.string().min(4),
  target_hours: z.number().min(6).max(9),
});

export const HabitSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().min(1),
  anchor: z.string().min(1),
});

export const MealSchema = z.object({
  meal: z.enum(["breakfast", "lunch", "snack", "dinner"]),
  catalog_id: z.string().min(1),
  name: z.string().min(1),
  kcal: z.number().min(0),
  macros: z.object({
    protein_g: z.number().min(0),
    carbs_g: z.number().min(0),
    fats_g: z.number().min(0),
    fiber_g: z.number().min(0).default(0),
  }),
  safe_swaps: z.array(z.string().min(1)).min(1),
});

export const YogaItemSchema = z.object({
  flow_id: z.string().min(1),
  name: z.string().min(1),
  duration_min: z.number().int().min(5).max(120),
  focus: z.string().min(1),
  intensity: z.enum(["low", "moderate", "high"]),
});

export const BreathworkSchema = z.object({
  name: z.string().min(1),
  duration_min: z.number().int().min(3).max(30),
  technique: z.string().min(1),
});

export const DayPlanSchema = z.object({
  day_index: z.number().int().min(1),
  theme: z.string().min(1),
  yoga: z.array(YogaItemSchema),
  breathwork: z.array(BreathworkSchema),
  habits: z.array(HabitSchema).min(1),
  meals: z.array(MealSchema).min(3),
  hydration_ml_target: z.number().int().min(1500).max(5000),
  sleep: SleepSchema,
  time_allocated_min: z.number().int().min(20).max(240),
  intensity_note: z.string().min(1),
  citations: z.array(CitationSchema).min(1),
});

export const WeekPlanSchema = z.object({
  week_index: z.number().int().min(1),
  focus: z.string().min(1),
  progression_note: z.string().min(1),
  is_deload: z.boolean().default(false),
  days: z.array(DayPlanSchema).min(5).max(7),
});

export const PlanMetaSchema = z.object({
  profile_id: z.string().min(1),
  profile_snapshot: z.any(), // uses Profile schema but keep loose to avoid cycles in zod
  goals: z.array(z.string().min(1)),
  duration_days: z.number().int().min(1),
  weeks: z.number().int().min(1),
  kcal_target: z.number().min(1000),
  hydration_ml_target: z.number().min(2000),
  assumptions: z.array(z.string().min(1)).default([]),
});

export const PlanSchema = z.object({
  id: z.string().min(1),
  meta: PlanMetaSchema,
  weeks: z.array(WeekPlanSchema).min(1),
  citations: z.array(CitationSchema).min(1),
  warnings: z.array(z.string().min(1)).default([]),
});

export type Plan = z.infer<typeof PlanSchema>;

export const QualityScoreSchema = z.object({
  safety: z.number().min(0).max(1),
  diet_match: z.number().min(0).max(1),
  progression: z.number().min(0).max(1),
  structure: z.number().min(0).max(1),
  overall: z.number().min(0).max(1),
});

export type QualityScore = z.infer<typeof QualityScoreSchema>;

export const VerifierResultSchema = z.object({
  plan: PlanSchema,
  warnings: z.array(z.string().min(1)),
  citations: z.array(CitationSchema),
  quality_score: QualityScoreSchema,
});

export type VerifierResult = z.infer<typeof VerifierResultSchema>;
