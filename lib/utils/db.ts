import fs from "fs/promises";
import path from "path";
import { hasFirestoreConfig, env } from "./env";
import type { Plan } from "@/lib/ai/schemas";

const STATE_PATH = path.join(process.cwd(), "lifeengine.state.json");

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

type ProfileRow = {
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

async function readLocalState(): Promise<MemoryState> {
  if (cachedState) return cachedState;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const file = await fs.readFile(STATE_PATH, "utf8");
      const parsed = JSON.parse(file) as MemoryState;
      return ensureAnchorProfile(parsed);
    } catch (error) {
      const fresh = defaultState();
      await writeLocalState(fresh);
      return fresh;
    }
  })();
  cachedState = await loadingPromise;
  loadingPromise = null;
  return cachedState;
}

async function writeLocalState(state: MemoryState) {
  ensureAnchorProfile(state);
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
  cachedState = state;
}

let firestorePromise: Promise<import("firebase-admin/firestore").Firestore> | null = null;

async function getFirestore() {
  if (!hasFirestoreConfig) {
    throw new Error("Firestore configuration missing");
  }
  if (!firestorePromise) {
    firestorePromise = (async () => {
      const { getApps, initializeApp, cert } = await import("firebase-admin/app");
      const { getFirestore } = await import("firebase-admin/firestore");
      if (!getApps().length) {
        initializeApp({
          credential: cert({
            projectId: env.FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: env.FIREBASE_PRIVATE_KEY,
          }),
        });
      }
      return getFirestore();
    })();
  }
  return firestorePromise;
}

async function ensureAnchorProfileFirestore() {
  const db = await getFirestore();
  const doc = await db.collection("lifeengine_profiles").doc(defaultProfile.id).get();
  if (!doc.exists) {
    await db.collection("lifeengine_profiles").doc(defaultProfile.id).set(defaultProfile);
  }
}

async function getProfilesFirestore(): Promise<ProfileRow[]> {
  await ensureAnchorProfileFirestore();
  const db = await getFirestore();
  const snap = await db.collection("lifeengine_profiles").orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => doc.data() as ProfileRow);
}

async function saveProfileFirestore(profile: ProfileRow) {
  const db = await getFirestore();
  await db.collection("lifeengine_profiles").doc(profile.id).set({
    ...profile,
    createdAt: profile.createdAt ?? new Date().toISOString(),
  });
}

async function updateProfileFirestore(profile: ProfileRow) {
  const db = await getFirestore();
  await db.collection("lifeengine_profiles").doc(profile.id).set({
    ...profile,
    createdAt: profile.createdAt ?? new Date().toISOString(),
  });
}

async function deleteProfileFirestore(id: string) {
  if (id === defaultProfile.id) return; // keep anchor profile in remote store
  const db = await getFirestore();
  await db.collection("lifeengine_profiles").doc(id).delete();
}

async function savePlanFirestore(plan: PlanRow) {
  const db = await getFirestore();
  await db.collection("lifeengine_plans").doc(plan.planId).set({
    ...plan,
    createdAt: plan.createdAt ?? new Date().toISOString(),
  });
}

async function listPlansFirestore(profileId: string): Promise<PlanRow[]> {
  const db = await getFirestore();
  const snap = await db
    .collection("lifeengine_plans")
    .where("profileId", "==", profileId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((doc) => doc.data() as PlanRow);
}

async function getPlanFirestore(planId: string): Promise<PlanRow | null> {
  const db = await getFirestore();
  const doc = await db.collection("lifeengine_plans").doc(planId).get();
  return doc.exists ? (doc.data() as PlanRow) : null;
}

async function listAllPlansFirestore(): Promise<PlanRow[]> {
  const db = await getFirestore();
  const snap = await db.collection("lifeengine_plans").orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => doc.data() as PlanRow);
}

export const db = {
  async getProfiles(): Promise<ProfileRow[]> {
    if (hasFirestoreConfig) {
      return getProfilesFirestore();
    }
    const state = await readLocalState();
    return [...state.profiles].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  },
  async saveProfile(profile: ProfileRow) {
    const payload = { ...profile, createdAt: profile.createdAt ?? new Date().toISOString() };
    if (hasFirestoreConfig) {
      await saveProfileFirestore(payload);
      return;
    }
    const state = await readLocalState();
    const filtered = state.profiles.filter((p) => p.id !== profile.id);
    state.profiles = [payload, ...filtered];
    await writeLocalState(state);
  },
  async updateProfile(profile: ProfileRow) {
    const payload = { ...profile, createdAt: profile.createdAt ?? new Date().toISOString() };
    if (hasFirestoreConfig) {
      await updateProfileFirestore(payload);
      return;
    }
    const state = await readLocalState();
    state.profiles = state.profiles.map((p) => (p.id === profile.id ? { ...p, ...payload } : p));
    await writeLocalState(state);
  },
  async deleteProfile(id: string) {
    if (hasFirestoreConfig) {
      await deleteProfileFirestore(id);
      return;
    }
    if (id === defaultProfile.id) {
      return;
    }
    const state = await readLocalState();
    state.profiles = state.profiles.filter((profile) => profile.id !== id);
    state.plans = state.plans.filter((plan) => plan.profileId !== id);
    await writeLocalState(state);
  },
  async savePlan(plan: PlanRow) {
    const payload = { ...plan, createdAt: plan.createdAt ?? new Date().toISOString() };
    if (hasFirestoreConfig) {
      await savePlanFirestore(payload);
      return;
    }
    const state = await readLocalState();
    state.plans = [payload, ...state.plans];
    await writeLocalState(state);
  },
  async listPlans(profileId: string): Promise<PlanRow[]> {
    if (hasFirestoreConfig) {
      return listPlansFirestore(profileId);
    }
    const state = await readLocalState();
    return state.plans
      .filter((plan) => plan.profileId === profileId)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  },
  async listAllPlans(): Promise<PlanRow[]> {
    if (hasFirestoreConfig) {
      return listAllPlansFirestore();
    }
    const state = await readLocalState();
    return [...state.plans].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  },
  async getPlan(planId: string): Promise<PlanRow | null> {
    if (hasFirestoreConfig) {
      return getPlanFirestore(planId);
    }
    const state = await readLocalState();
    return state.plans.find((plan) => plan.planId === planId) ?? null;
  },
};
