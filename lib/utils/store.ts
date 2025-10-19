import type { Profile } from '@/lib/domain/profile';
import type { Plan } from '@/lib/domain/plan';

const PROFILES_KEY = 'th_profiles';
const PLANS_KEY = 'th_plans';

export type StoredPlan = {
  id: string;
  plan: Plan;
  profileId: string;
  warnings: string[];
  analytics: any;
  createdAt: number;
};

export function getProfiles(): Profile[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PROFILES_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveProfile(profile: Profile) {
  const profiles = getProfiles().filter(p => p.id !== profile.id);
  profiles.push(profile);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getPlans(): StoredPlan[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(PLANS_KEY);
  return data ? JSON.parse(data) : [];
}

export function savePlan(plan: StoredPlan) {
  const plans = getPlans().filter(p => p.id !== plan.id);
  plans.push(plan);
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export const savePlanRecord = (record: StoredPlan) => {
  savePlan(record);
  return getPlans();
};
