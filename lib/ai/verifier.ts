import { Plan, Profile } from './schemas';
import { checkContras } from '../rules/contra';
import { calculateProgressionLimits } from '../rules/progression';
import { deriveNutritionTargets } from '../rules/diet';

export interface VerificationResult {
  safe: boolean;
  issues: string[];
  recommendations: string[];
}

export function verifyPlan(plan: Plan, profile: Profile): VerificationResult {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check contraindications
  const contraResult = checkContras(profile, plan.days[0]?.activities[0]?.type || 'general');
  if (!contraResult.safe) {
    issues.push(...contraResult.reasons);
  }

  // Check progression limits
  const limits = calculateProgressionLimits(profile, plan.days[0]?.activities[0]?.type || 'general');

  plan.days.forEach((day, dayIndex) => {
    const totalActivityDuration = day.activities.reduce((sum, activity) => sum + activity.duration, 0);
    const totalCalories = day.meals.reduce((sum, meal) => sum + meal.calories, 0);

    // Duration check
    if (totalActivityDuration > limits.maxDuration) {
      issues.push(`Day ${dayIndex + 1}: Activity duration (${totalActivityDuration}min) exceeds safe limit (${limits.maxDuration}min)`);
      recommendations.push(`Reduce activity duration on day ${dayIndex + 1} or split into multiple sessions`);
    }

    // Nutrition check
    const nutritionTargets = deriveNutritionTargets(profile, { profileId: profile.id, primaryPlanType: 'general', secondaryPlanType: '', startDate: '', endDate: '', preferences: {} });
    if (Math.abs(totalCalories - nutritionTargets.dailyCalories) > nutritionTargets.dailyCalories * 0.2) {
      issues.push(`Day ${dayIndex + 1}: Daily calories (${totalCalories}) significantly differ from target (${nutritionTargets.dailyCalories})`);
      recommendations.push(`Adjust meal portions on day ${dayIndex + 1} to better match nutritional goals`);
    }

    // Rest days check
    if (dayIndex > 0 && totalActivityDuration < 10) {
      recommendations.push(`Consider light activity on day ${dayIndex + 1} if it appears to be a rest day`);
    }
  });

  // Weekly session check
  const activeDays = plan.days.filter(day => day.activities.length > 0).length;
  if (activeDays > limits.maxSessionsPerWeek) {
    issues.push(`Too many active days (${activeDays}) per week. Recommended max: ${limits.maxSessionsPerWeek}`);
    recommendations.push('Add more rest days or reduce activity intensity');
  }

  // Age-specific checks
  if (profile.age > 60 && activeDays > 4) {
    issues.push('Individuals over 60 should have more rest days');
    recommendations.push('Consider 3-4 active days per week maximum');
  }

  return {
    safe: issues.length === 0,
    issues,
    recommendations,
  };
}