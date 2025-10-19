import type { Profile } from "@/lib/domain/profile";
import type { Plan } from "@/lib/domain/plan";

export const LOCAL_CHANGE_EVENT = "th-local-change";

const PROFILES_KEY = "th_profiles";
const PLANS_KEY = "th_plans";

export type StoredPlan = {
  id: string;
  plan: Plan;
  profileId: string;
  warnings: string[];
  analytics: Plan["analytics"];
  createdAt: number;
};

function emitChange(key: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LOCAL_CHANGE_EVENT, { detail: { key } })
  );
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emitChange(key);
}

export function getProfiles(): Profile[] {
  return readJson<Profile[]>(PROFILES_KEY, []);
}

export function saveProfile(profile: Profile) {
  const profiles = getProfiles().filter((p) => p.id !== profile.id);
  profiles.push(profile);
  writeJson(PROFILES_KEY, profiles);
  return profiles;
}

export function deleteProfile(id: string) {
  const profiles = getProfiles().filter((p) => p.id !== id);
  writeJson(PROFILES_KEY, profiles);
  return profiles;
}

export function exportProfiles(): string {
  return JSON.stringify(getProfiles(), null, 2);
}

export function importProfiles(json: string) {
  const payload = JSON.parse(json);
  if (!Array.isArray(payload)) {
    throw new Error("Invalid profile JSON payload");
  }
  writeJson(PROFILES_KEY, payload);
}

export function getPlans(): StoredPlan[] {
  return readJson<StoredPlan[]>(PLANS_KEY, []);
}

export function savePlanRecord(record: StoredPlan) {
  const plans = getPlans().filter((entry) => entry.id !== record.id);
  plans.push(record);
  writeJson(PLANS_KEY, plans);
  return plans;
}

export function deletePlan(id: string) {
  const plans = getPlans().filter((entry) => entry.id !== id);
  writeJson(PLANS_KEY, plans);
  return plans;
}

export function exportPlans(): string {
  return JSON.stringify(getPlans(), null, 2);
}

export function importPlans(json: string) {
  const payload = JSON.parse(json);
  if (!Array.isArray(payload)) {
    throw new Error("Invalid plans JSON payload");
  }
  writeJson(PLANS_KEY, payload);
}
