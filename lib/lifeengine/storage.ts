import type { LifeEnginePlan } from "@/app/types/lifeengine";

const STORAGE_KEY = "th_lifeengine_saved_plans";

export type SavedPlanRecord = {
  id: string;
  profileId: string;
  planName: string;
  planTypes: string[];
  createdAt: string;
  source: "custom-gpt" | "gemini" | "rule-engine";
  plan: LifeEnginePlan;
  rawPrompt?: string;
};

export function loadSavedPlans(): SavedPlanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedPlanRecord[]) : [];
  } catch (error) {
    console.warn("Failed to load saved plans:", error);
    return [];
  }
}

export function savePlanRecord(record: SavedPlanRecord) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSavedPlans().filter((item) => item.id !== record.id);
    existing.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error("Failed to save plan record:", error);
  }
}

export function getSavedPlanById(id: string): SavedPlanRecord | undefined {
  return loadSavedPlans().find((plan) => plan.id === id);
}
