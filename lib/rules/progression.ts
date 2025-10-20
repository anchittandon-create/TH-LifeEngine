import { Profile } from '../ai/schemas';

export const PROGRESSION = {
  maxWeeklyIncreasePct: 20,
  deloadEveryWeeks: 4,
  deloadDropPct: 40,
};

export interface ProgressionLimits {
  maxDuration: number; // minutes per session
  maxSessionsPerWeek: number;
  maxCaloriesPerMeal: number;
  restDaysRequired: number;
}

export function calculateProgressionLimits(profile: Profile, planType: string, weeksCompleted: number = 0): ProgressionLimits {
  const baseLimits: ProgressionLimits = {
    maxDuration: 30,
    maxSessionsPerWeek: 3,
    maxCaloriesPerMeal: 500,
    restDaysRequired: 1,
  };

  // Adjust based on activity level
  switch (profile.activityLevel) {
    case 'sedentary':
      baseLimits.maxDuration = 20;
      baseLimits.maxSessionsPerWeek = 2;
      break;
    case 'light':
      baseLimits.maxDuration = 30;
      baseLimits.maxSessionsPerWeek = 3;
      break;
    case 'moderate':
      baseLimits.maxDuration = 45;
      baseLimits.maxSessionsPerWeek = 4;
      break;
    case 'active':
      baseLimits.maxDuration = 60;
      baseLimits.maxSessionsPerWeek = 5;
      break;
    case 'very_active':
      baseLimits.maxDuration = 90;
      baseLimits.maxSessionsPerWeek = 6;
      break;
  }

  // Adjust based on age
  if (profile.age > 50) {
    baseLimits.maxDuration *= 0.8;
    baseLimits.maxSessionsPerWeek = Math.max(2, baseLimits.maxSessionsPerWeek - 1);
  }

  // Adjust based on plan type
  if (planType.includes('strength')) {
    baseLimits.maxDuration += 15;
    baseLimits.restDaysRequired = 2;
  } else if (planType.includes('cardio')) {
    baseLimits.maxDuration += 30;
  } else if (planType.includes('yoga')) {
    baseLimits.maxDuration += 20;
  }

  // Progressive overload over weeks
  const progressionFactor = 1 + (weeksCompleted * 0.1); // 10% increase per week, capped later
  baseLimits.maxDuration = Math.min(baseLimits.maxDuration * progressionFactor, 120); // Max 2 hours
  baseLimits.maxSessionsPerWeek = Math.min(baseLimits.maxSessionsPerWeek + Math.floor(weeksCompleted / 4), 7);

  // Deload every 4 weeks
  if (weeksCompleted > 0 && weeksCompleted % 4 === 0) {
    baseLimits.maxDuration *= (1 - PROGRESSION.deloadDropPct / 100);
    baseLimits.maxSessionsPerWeek = Math.max(2, baseLimits.maxSessionsPerWeek - 1);
  }

  return baseLimits;
}

export function shouldDeload(weeksCompleted: number): boolean {
  return weeksCompleted > 0 && weeksCompleted % PROGRESSION.deloadEveryWeeks === 0;
}