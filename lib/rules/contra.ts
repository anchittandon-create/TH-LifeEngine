import { Profile } from '../ai/schemas';

export interface ContraResult {
  safe: boolean;
  reasons: string[];
}

export const CONTRA = {
  hypertension: {
    yoga_avoid: ['inversions', 'intense_flows'],
    breath_caution: ['breath_retention'],
  },
  diabetes: {
    yoga_avoid: ['fast_paced'],
    breath_caution: [],
  },
  // Add more as needed
};

export function checkContras(profile: Profile, planType: string): ContraResult {
  const reasons: string[] = [];

  // Age-based restrictions
  if (profile.age < 18 && planType.includes('intense')) {
    reasons.push('Intense plans not recommended for individuals under 18');
  }

  if (profile.age > 65 && planType.includes('high_impact')) {
    reasons.push('High-impact activities may pose risks for individuals over 65');
  }

  // Weight-based restrictions
  if (profile.weight < 45 && planType.includes('strength')) {
    reasons.push('Strength training requires adequate body weight for safety');
  }

  // Activity level checks
  if (profile.activityLevel === 'sedentary' && planType.includes('advanced')) {
    reasons.push('Advanced plans require higher baseline activity level');
  }

  // Goal-specific contras
  if (profile.goals.includes('weight_loss') && profile.weight < 50) {
    reasons.push('Extreme weight loss goals may not be safe at current weight');
  }

  // Flag-based restrictions
  if (profile.flags.includes('pregnant') && planType.includes('high_impact')) {
    reasons.push('High-impact activities not recommended during pregnancy');
  }

  if (profile.flags.includes('injury') && planType.includes('running')) {
    reasons.push('Running may aggravate existing injuries');
  }

  if (profile.flags.includes('heart_condition') && planType.includes('intense')) {
    reasons.push('Intense activities require medical clearance for heart conditions');
  }

  // Check against CONTRA table for medical flags
  profile.flags.forEach(flag => {
    if (flag in CONTRA) {
      const contra = (CONTRA as any)[flag];
      if (planType.includes('yoga') && contra.yoga_avoid.some((avoid: string) => planType.includes(avoid))) {
        reasons.push(`${flag} contraindicates certain yoga poses`);
      }
    }
  });

  return {
    safe: reasons.length === 0,
    reasons,
  };
}