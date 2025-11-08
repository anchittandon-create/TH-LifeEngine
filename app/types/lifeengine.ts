// TypeScript types for TH_LifeEngine Custom GPT integration
// Mirrors the JSON Schema from the GPT Structured Output

export type Gender = "male" | "female" | "other";

export type PlanType = "yoga" | "diet" | "combined" | "holistic";

export type CategoryTag =
  | "Mindful Beginner"
  | "Detox Challenger"
  | "Spine Strengthener"
  | "Stress Soother"
  | "Metabolic Balancer"
  | "Core Builder";

export interface Profile {
  profile_id?: string;
  name: string;
  age: number;
  gender: Gender;
  location?: string;
  goal: string;
  plan_type: PlanType[];
  preferred_time?: string;
  diet_type: string;
  activity_level?: string;
  work_schedule?: string;
  sleep_hours: number;
  stress_level: string;
  chronic_conditions?: string[];
  mental_state?: string;
  has_equipment?: boolean;
  language: string;
}

export interface YogaPose {
  name: string;
  duration_min: number;
  focus?: string;
  benefits?: string;
  steps?: string[]; // Step-by-step instructions ["Step 1: ...", "Step 2: ..."]
  breathing_instructions?: string; // Detailed breathing cues
  modifications?: string;
  common_mistakes?: string[]; // Common mistakes to avoid
}

export interface Exercise {
  name: string;
  type: string; // "strength", "cardio", "flexibility", etc.
  sets?: number;
  reps?: number | string; // Can be "12" or "30 seconds"
  rest_period?: string; // e.g., "60 seconds"
  steps?: string[]; // Step-by-step movement instructions
  form_cues?: string[]; // Proper form reminders
  common_mistakes?: string[]; // What to avoid
  progressions?: string; // How to make it harder
  regressions?: string; // How to make it easier
  duration_min?: number;
  description?: string;
}

export interface YogaSession {
  warmup_min?: number;
  sequence?: YogaPose[];
  breathwork?: string;
  cooldown_min?: number;
  journal_prompt?: string;
  focus_area?: string;
}

export interface Meal {
  title: string;
  ingredients?: string[]; // List of ingredients with quantities
  recipe_steps?: string[]; // Step-by-step cooking instructions
  preparation_time?: string; // e.g., "10 minutes"
  cooking_time?: string; // e.g., "15 minutes"
  notes?: string;
  portion_guidance?: string;
  swap?: string; // Healthy alternatives
}

export interface DietDay {
  breakfast?: Meal;
  lunch?: Meal;
  snacks?: Meal[];
  dinner?: Meal;
  evening_tea?: {
    title?: string;
    notes?: string;
  };
}

export interface HolisticDay {
  mindfulness?: string;
  affirmation?: string;
  sleep?: string;
  rest_day?: boolean;
}

export interface DayPlan {
  yoga?: YogaSession;
  diet?: DietDay;
  holistic?: HolisticDay;
  exercises?: Exercise[]; // Fitness exercises for the day
}

export interface WeeklySchedule {
  monday?: DayPlan;
  tuesday?: DayPlan;
  wednesday?: DayPlan;
  thursday?: DayPlan;
  friday?: DayPlan;
  saturday?: DayPlan;
  sunday?: DayPlan;
}

export interface PlanMetadata {
  generated_by: "gpt";
  plan_type: PlanType[];
  language: string;
  timestamp: string; // ISO 8601
  profile_id?: string;
}

export interface LifeEnginePlan {
  motivation?: string;
  category_tag?: CategoryTag;
  summary: string;
  weekly_schedule: WeeklySchedule;
  recovery_tips: string[];
  hydration_goals: string;
  metadata: PlanMetadata;
  disclaimer?: string;
}

export interface PlanPostResponse {
  ok: boolean;
  plan_id: string;
}

export interface APIError {
  error: string;
}
