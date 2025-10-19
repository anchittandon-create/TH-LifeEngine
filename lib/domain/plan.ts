import type { Intake } from './intake';

export type Week = {
  weekNumber: number;
  days: {
    dayNumber: number;
    yoga?: any[];
    nutrition?: {
      kcal_target: number;
      meals?: { meal: string; name: string }[];
    };
    breathwork?: any[];
    habits?: string[];
    mindfulness?: string[];
    theme?: string;
    notes?: string;
    hydration_ml_target?: number;
  }[];
  focus?: string;
  progression_note?: string;
};

export type Plan = {
  id: string;
  profileId: string;
  intake: Intake;
  weeks: Week[];
  createdAt: number;
  analytics?: any;
  meta?: {
    title?: string;
    summary?: string;
    goals?: string[];
    duration_days?: number;
    weeks?: number;
    time_budget_min_per_day?: number;
    flags?: string[];
  };
  coach_messages?: string[];
  adherence_tips?: string[];
  citations?: string[];
  warnings?: string[];
};
