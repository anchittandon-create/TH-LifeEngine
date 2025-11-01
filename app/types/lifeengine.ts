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
  modifications?: string;
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
  notes?: string;
  portion_guidance?: string;
  swap?: string;
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
