import { put, list, head, del } from "@vercel/blob";
import type { Plan } from "@/lib/ai/schemas";
import { hasVercelBlobStorage } from "./env";

const BLOB_KEY = "lifeengine.state.json";

export type Sex = "F" | "M" | "Other";

type Contact = {
  email?: string;
  phone?: string;
  location?: string;
};

type PreferredSlot = {
  start?: string;
  end?: string;
};

export type ProfileRow = {
  id: string;
  name: string;
  demographics?: {
    age?: number;
    sex?: Sex;
    height?: number;
    weight?: number;
  };
  contact?: Contact;
  lifestyle?: {
    occupation?: string;
    timeZone?: string;
    activityLevel?: string;
    primaryGoal?: string;
    secondaryGoals?: string[];
  };
  health?: {
    flags?: string[];
    allergies?: string[];
    chronicConditions?: string[];
    injuries?: string[];
    medications?: string[];
    notes?: string;
  };
  nutrition?: {
    dietType?: string;
    cuisinePreference?: string;
    dislikes?: string[];
    supplements?: string[];
    hydrationTargetMl?: number;
    fastingWindow?: string;
  };
  schedule?: {
    timeBudgetMin?: number;
    daysPerWeek?: number;
    preferredSlots?: PreferredSlot[];
    notes?: string;
  };
  equipment?: string[];
  preferences?: {
    modules?: string[];
    tone?: "gentle" | "balanced" | "intense";
    indoorOnly?: boolean;
    level?: "beginner" | "intermediate" | "advanced" | string;
    coachingNotes?: string;
    focusAreas?: string[];
  };
  coachingNotes?: string;
  createdAt?: string;
};

type PlanRow = {
  planId: string;
  profileId: string;
  days: number;
  confidence: number;
  warnings: string[];
  planJSON: Plan;
  createdAt?: string;
};

type MemoryState = {
  profiles: ProfileRow[];
  plans: PlanRow[];
};

const defaultProfile: ProfileRow = {
  id: "prof_anchit",
  name: "Anchit",
  demographics: {
    age: 34,
    sex: "M",
    height: 178,
    weight: 78,
  },
  contact: {
    email: "anchit@timesgroup.com",
    phone: "+91-90000-00000",
    location: "Mumbai, IN",
  },
  lifestyle: {
    occupation: "Senior Product Manager",
    timeZone: "Asia/Kolkata",
    activityLevel: "moderate",
    primaryGoal: "PCOD-friendly lean gain",
    secondaryGoals: ["stress_balance", "gut_health"],
  },
  health: {
    flags: ["pcod"],
    allergies: ["almonds"],
    chronicConditions: ["thyroid"],
    injuries: [],
    medications: [],
    notes: "Prefers low-impact flows during luteal phase.",
  },
  nutrition: {
    dietType: "vegetarian",
    cuisinePreference: "Indian home-cooked",
    dislikes: ["raw onion"],
    supplements: ["vitamin_d3"],
    hydrationTargetMl: 2800,
    fastingWindow: "14:10",
  },
  schedule: {
    timeBudgetMin: 45,
    daysPerWeek: 5,
    preferredSlots: [{ start: "19:30", end: "21:00" }],
    notes: "Avoid late-night sessions on Fridays.",
  },
  equipment: ["mat", "blocks"],
  preferences: {
    modules: ["yoga", "nutrition", "mindfulness", "sleep"],
    tone: "balanced",
    indoorOnly: true,
    level: "intermediate",
    coachingNotes: "Enjoys metrics and weekly progress summaries.",
    focusAreas: ["pelvic_floor", "core_strength"],
  },
  coachingNotes: "Cycle-sensitive programming required; integrate hydration reminders.",
  createdAt: new Date().toISOString(),
};

function ensureAnchorProfile(state: MemoryState): MemoryState {
  const existing = state.profiles.find((profile) => profile.id === defaultProfile.id);
  const merged = {
    ...defaultProfile,
    ...(existing ?? {}),
    demographics: { ...defaultProfile.demographics, ...(existing?.demographics ?? {}) },
    contact: { ...defaultProfile.contact, ...(existing?.contact ?? {}) },
    lifestyle: { ...defaultProfile.lifestyle, ...(existing?.lifestyle ?? {}) },
    health: {
      ...defaultProfile.health,
      ...(existing?.health ?? {}),
      flags: existing?.health?.flags ?? defaultProfile.health?.flags,
      allergies: existing?.health?.allergies ?? defaultProfile.health?.allergies,
      chronicConditions: existing?.health?.chronicConditions ?? defaultProfile.health?.chronicConditions,
      injuries: existing?.health?.injuries ?? defaultProfile.health?.injuries,
      medications: existing?.health?.medications ?? defaultProfile.health?.medications,
    },
    nutrition: { ...defaultProfile.nutrition, ...(existing?.nutrition ?? {}) },
    schedule: { ...defaultProfile.schedule, ...(existing?.schedule ?? {}) },
    equipment: existing?.equipment ?? defaultProfile.equipment,
    preferences: {
      ...defaultProfile.preferences,
      ...(existing?.preferences ?? {}),
      modules: existing?.preferences?.modules ?? defaultProfile.preferences?.modules,
      focusAreas: existing?.preferences?.focusAreas ?? defaultProfile.preferences?.focusAreas,
    },
    coachingNotes: existing?.coachingNotes ?? defaultProfile.coachingNotes,
  } satisfies ProfileRow;
  const others = state.profiles.filter((profile) => profile.id !== defaultProfile.id);
  state.profiles = [merged, ...others];
  return state;
}

function defaultState(): MemoryState {
  return ensureAnchorProfile({ profiles: [{ ...defaultProfile }], plans: [] });
}

let cachedState: MemoryState | null = null;
let loadingPromise: Promise<MemoryState> | null = null;

async function readState(): Promise<MemoryState> {
  if (!hasVercelBlobStorage) {
    // This is a fallback for local development if blob storage is not configured.
    // It is not a recommended production path.
    console.warn("Vercel Blob Storage not configured. Using fallback.");
    return defaultState();
  }
  if (cachedState) return cachedState;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const blob = await head(BLOB_KEY);
      if (!blob) {
        const fresh = defaultState();
        await writeState(fresh);
        return fresh;
      }
      const response = await fetch(blob.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch state from blob: ${response.statusText}`);
      }
      const parsed = (await response.json()) as MemoryState;
      return ensureAnchorProfile(parsed);
    } catch (error) {
      console.error("Error reading from blob, returning default state:", error);
      const fresh = defaultState();
      await writeState(fresh);
      return fresh;
    }
  })();

  cachedState = await loadingPromise;
  loadingPromise = null;
  return cachedState;
}

async function writeState(state: MemoryState) {
  ensureAnchorProfile(state);
  if (hasVercelBlobStorage) {
    await put(BLOB_KEY, JSON.stringify(state, null, 2), {
      access: "public", // 'public' is required for the free tier.
      addRandomSuffix: false,
    });
  }
  cachedState = state;
}

export const db = {
  async getProfiles(): Promise<ProfileRow[]> {
    const state = await readState();
    return [...state.profiles].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  },
  async saveProfile(profile: ProfileRow) {
    const payload = { ...profile, createdAt: profile.createdAt ?? new Date().toISOString() };
    const state = await readState();
    const filtered = state.profiles.filter((p) => p.id !== profile.id);
    state.profiles = [payload, ...filtered];
    await writeState(state);
  },
  async updateProfile(profile: ProfileRow) {
    const payload = { ...profile, createdAt: profile.createdAt ?? new Date().toISOString() };
    const state = await readState();
    state.profiles = state.profiles.map((p) => (p.id === profile.id ? { ...p, ...payload } : p));
    await writeState(state);
  },
  async deleteProfile(id: string) {
    if (id === defaultProfile.id) {
      return;
    }
    const state = await readState();
    state.profiles = state.profiles.filter((profile) => profile.id !== id);
    state.plans = state.plans.filter((plan) => plan.profileId !== id);
    await writeState(state);
},
  async savePlan(plan: PlanRow) {
    const payload = { ...plan, createdAt: plan.createdAt ?? new Date().toISOString() };
    const state = await readState();
    state.plans = [payload, ...state.plans];
    await writeState(state);
  },
  async listPlans(profileId: string): Promise<PlanRow[]> {
    const state = await readState();
    return state.plans
      .filter((plan) => plan.profileId === profileId)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  },
  async listAllPlans(): Promise<PlanRow[]> {
    const state = await readState();
    return [...state.plans].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  },
  async getPlan(planId: string): Promise<PlanRow | null> {
    const state = await readState();
    return state.plans.find((plan) => plan.planId === planId) ?? null;
  },
};