import type { Profile } from "./profile";

export type Intake = {
  profileId: string;
  profileSnapshot: Profile;
  goals: { name: string; target_metric?: string; priority?: number }[];
  duration: { unit: "days" | "weeks" | "months" | "years"; value: number };
  time_budget_min_per_day: number;
  experience_level: "beginner" | "intermediate" | "advanced";
  equipment: {
    mat?: boolean;
    blocks?: boolean;
    strap?: boolean;
    weights?: boolean;
    chair?: boolean;
  };
};
