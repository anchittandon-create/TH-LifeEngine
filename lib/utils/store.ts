import type { Profile } from "@/lib/domain/profile";
import type { Plan } from "@/lib/domain/plan";

const PROFILE_KEY = "th_profiles";
const PLAN_KEY = "th_plans";

export type StoredPlan = {
  id: string;
  plan: Plan;
  profileId: string;
  warnings: string[];
  analytics: Plan["analytics"];
  createdAt: number;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getProfiles(): Profile[] {
  return readJson<Profile[]>(PROFILE_KEY, []);
}

export function saveProfile(profile: Profile) {
  const profiles = getProfiles();
  const next = profiles.filter((p) => p.id !== profile.id);
  next.push(profile);
  writeJson(PROFILE_KEY, next);
  return next;
}

export function deleteProfile(id: string) {
  const profiles = getProfiles().filter((p) => p.id !== id);
  writeJson(PROFILE_KEY, profiles);
  return profiles;
}

export function exportProfiles(): string {
  return JSON.stringify(getProfiles(), null, 2);
}

export function importProfiles(json: string) {
  try {
    const payload = JSON.parse(json);
    if (Array.isArray(payload)) {
      writeJson(PROFILE_KEY, payload);
    }
  } catch {
    throw new Error("Invalid profile JSON payload");
  }
}

export function getPlans(): StoredPlan[] {
  return readJson<StoredPlan[]>(PLAN_KEY, []);
}

export function savePlanRecord(record: StoredPlan) {
  const plans = getPlans().filter((entry) => entry.id !== record.id);
  plans.push(record);
  writeJson(PLAN_KEY, plans);
  return plans;
}

export function deletePlan(id: string) {
  const plans = getPlans().filter((entry) => entry.id !== id);
  writeJson(PLAN_KEY, plans);
  return plans;
}

export function exportPlans(): string {
  return JSON.stringify(getPlans(), null, 2);
}

export function importPlans(json: string) {
  try {
    const payload = JSON.parse(json);
    if (Array.isArray(payload)) {
      writeJson(PLAN_KEY, payload);
    }
  } catch {
    throw new Error("Invalid plans JSON payload");
  }
}

export function upsertPlans(plans: StoredPlan[]) {
  writeJson(PLAN_KEY, plans);
}
