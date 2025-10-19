import { z } from "zod";

export const GenderEnum = z.enum(["F", "M", "Other"]);
export const RegionEnum = z.enum(["IN", "US", "EU", "Global"]);

export const DietaryTypeEnum = z.enum(["veg", "vegan", "eggetarian", "non_veg", "jain", "gluten_free", "lactose_free"]);

export const PreferredSlotSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/).describe("24h time lower bound, HH:MM"),
  end: z.string().regex(/^\d{2}:\d{2}$/).describe("24h time upper bound, HH:MM"),
});

export const ProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  gender: GenderEnum,
  age: z.number().int().min(10).max(100),
  height_cm: z.number().int().min(120).max(220),
  weight_kg: z.number().min(30).max(200),
  region: RegionEnum,
  medical_flags: z.array(z.string().min(1)).default([]),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).default("moderate"),
  dietary: z.object({
    type: DietaryTypeEnum,
    allergies: z.array(z.string().min(1)).default([]),
    avoid_items: z.array(z.string().min(1)).default([]),
    cuisine_pref: z.string().min(1).default(""),
  }),
  preferences: z.object({
    tone: z.enum(["gentle", "balanced", "intense"]).default("balanced"),
    indoor_only: z.boolean().default(false),
    notes: z.string().max(500).default(""),
  }),
  availability: z.object({
    days_per_week: z.number().int().min(1).max(7),
    preferred_slots: z.array(PreferredSlotSchema).default([]),
  }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export function computeBmi(heightCm: number, weightKg: number): number {
  const heightMeters = heightCm / 100;
  const bmi = weightKg / (heightMeters * heightMeters);
  return Math.round(bmi * 10) / 10;
}

export type GoalType = "fat_loss" | "lean_gain" | "maintenance" | "pcod_remission" | "stress_balance";

const GOAL_CALORIE_OFFSETS: Record<GoalType, number> = {
  fat_loss: -400,
  lean_gain: 300,
  maintenance: 0,
  pcod_remission: -250,
  stress_balance: -100,
};

const ACTIVITY_FACTORS: Record<Profile["activity_level"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const REGION_CLIMATE_MULTIPLIER: Record<Profile["region"], number> = {
  IN: 1.05,
  US: 1.0,
  EU: 0.98,
  Global: 1.0,
};

export function estimateBmr(profile: Profile): number {
  const weight = profile.weight_kg;
  const height = profile.height_cm;
  const age = profile.age;
  if (profile.gender === "M") {
    return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  }
  if (profile.gender === "F") {
    return 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  }
  // Other -> mean of M/F
  return (estimateBmr({ ...profile, gender: "M" }) + estimateBmr({ ...profile, gender: "F" })) / 2;
}

export function computeMaintenanceCalories(profile: Profile): number {
  const bmr = estimateBmr(profile);
  const activityFactor = ACTIVITY_FACTORS[profile.activity_level] ?? 1.4;
  return Math.round(bmr * activityFactor);
}

export function deriveCalorieTarget(profile: Profile, goal: GoalType): number {
  const baseline = computeMaintenanceCalories(profile);
  const offset = GOAL_CALORIE_OFFSETS[goal] ?? 0;
  const regionMultiplier = REGION_CLIMATE_MULTIPLIER[profile.region] ?? 1;
  return Math.max(1200, Math.round((baseline + offset) * regionMultiplier));
}

export function computeHydrationTargetMl(profile: Profile): number {
  const base = Math.max(35 * profile.weight_kg, 2000);
  const regionMultiplier = REGION_CLIMATE_MULTIPLIER[profile.region] ?? 1;
  return Math.round(base * regionMultiplier);
}
