import type { Profile } from '../domain/profile';
import type { Intake } from '../domain/intake';

export function calculateCalories(profile: Profile, goal: string): number {
  const base = 2000; // Simplified
  if (goal.includes('weight loss')) {
    return base - 500;
  } else if (goal.includes('weight gain')) {
    return base + 500;
  }
  return base;
}

export function deriveBasics(profile: Profile, intake: Intake) {
  const kcalTarget = calculateCalories(profile, intake.goals.join(' '));
  return {
    kcalTarget,
    hydration: 2000, // ml per day
  };
}
