import { put, list, head, del } from "@vercel/blob";
import { promises as fs } from 'fs';
import path from 'path';
import { hasVercelBlobStorage } from "./env";
import type { Profile } from "@/lib/ai/schemas";

// ✨ NEW: Separate blob keys for profiles and plans
const PROFILES_BLOB_KEY = "th-lifeengine-profiles.json";
const PLANS_BLOB_KEY = "th-lifeengine-plans.json";

// Local fallback paths
const PROFILES_LOCAL_PATH = path.join(process.cwd(), 'profiles.json');
const PLANS_LOCAL_PATH = path.join(process.cwd(), 'plans.json');

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

export type StoredPlanDay = {
  date: string;
  activities: {
    type: string;
    name: string;
    duration: number;
    description: string;
  }[];
  meals: {
    type: string;
    name: string;
    calories: number;
    description: string;
  }[];
};

export type StoredPlan = {
  id: string;
  profileId: string;
  intakeId: string;
  goals: string[];
  createdAt: string;
  days: StoredPlanDay[];
};

export type UiProfileSnapshot = Profile & {
  createdAt: string;
  updatedAt?: string;
};

export type ProfileRow = {
  id: string;
  name: string;
  age?: number;
  gender?: Profile["gender"];
  goals?: string[];
  healthConcerns?: string;
  experience?: Profile["experience"];
  preferredTime?: Profile["preferredTime"];
  subscriptionType?: Profile["subscriptionType"];
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
    level?: string;
    focusAreas?: string[];
    coachingNotes?: string;
    tone?: string;
    indoorOnly?: boolean;
  };
  coachingNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  ui?: UiProfileSnapshot;
};

export type PlanRow = {
  planId: string;
  profileId: string;
  planName: string;
  inputSummary?: string;
  days: number;
  confidence: number;
  warnings: string[];
  planJSON: StoredPlan;
  analytics?: any;
  costMetrics?: any;
  createdAt: string;
  source?: "gemini" | "custom-gpt" | "rule-engine";
};

// ✨ Caching
let cachedProfiles: ProfileRow[] | null = null;
let cachedPlans: PlanRow[] | null = null;
let profilesLoadingPromise: Promise<ProfileRow[]> | null = null;
let plansLoadingPromise: Promise<PlanRow[]> | null = null;

// Default profile for initialization
const defaultTimestamp = new Date().toISOString();
const defaultProfile: ProfileRow = {
  id: "default_profile",
  name: "Anchit Tandon",
  age: 28,
  gender: "male",
  goals: ["Build muscle", "Improve flexibility", "Better sleep"],
  healthConcerns: "",
  experience: "intermediate",
  preferredTime: "morning",
  subscriptionType: "quarterly",
  demographics: {
    age: 28,
    sex: "M",
    height: 175,
    weight: 72,
  },
  contact: {
    email: "",
    phone: "",
    location: "Global",
  },
  lifestyle: {
    occupation: "Software Developer",
    timeZone: "Asia/Kolkata",
    activityLevel: "moderate",
    primaryGoal: "Build muscle",
    secondaryGoals: ["Improve flexibility", "Better sleep"],
  },
  health: {
    flags: [],
    allergies: [],
    chronicConditions: [],
    injuries: [],
    medications: [],
    notes: "",
  },
  nutrition: {
    dietType: "veg",
    cuisinePreference: "indian",
    dislikes: [],
    supplements: [],
    hydrationTargetMl: 3000,
    fastingWindow: "",
  },
  schedule: {
    timeBudgetMin: 45,
    daysPerWeek: 5,
    preferredSlots: [{ start: "06:00", end: "09:00" }],
    notes: "",
  },
  equipment: ["Yoga mat", "Dumbbells", "Resistance bands"],
  preferences: {
    modules: ["yoga", "fitness", "diet"],
    level: "intermediate",
    focusAreas: ["Build muscle", "Improve flexibility", "Better sleep"],
    coachingNotes: "",
    tone: "balanced",
    indoorOnly: false,
  },
  coachingNotes: "",
  createdAt: defaultTimestamp,
  updatedAt: defaultTimestamp,
  ui: {
    id: "default_profile",
    name: "Anchit Tandon",
    age: 28,
    gender: "male",
    goals: ["Build muscle", "Improve flexibility", "Better sleep"],
    healthConcerns: "",
    experience: "intermediate",
    preferredTime: "morning",
    subscriptionType: "quarterly",
    createdAt: defaultTimestamp,
    updatedAt: defaultTimestamp,
  },
};

// ============================================
// PROFILES STORAGE
// ============================================

async function readProfiles(): Promise<ProfileRow[]> {
  if (!hasVercelBlobStorage) {
    console.log('📂 [DB] Using local file storage for profiles');
    try {
      const data = await fs.readFile(PROFILES_LOCAL_PATH, 'utf-8');
      const profiles = JSON.parse(data) as ProfileRow[];
      return ensureDefaultProfile(profiles);
    } catch (error) {
      console.warn('⚠️ [DB] No local profiles file, using default');
      const profiles = [defaultProfile];
      await writeProfiles(profiles);
      return profiles;
    }
  }

  if (cachedProfiles) {
    console.log('💾 [DB] Returning cached profiles:', cachedProfiles.length);
    return cachedProfiles;
  }

  if (profilesLoadingPromise) {
    console.log('⏳ [DB] Waiting for profiles loading promise');
    return profilesLoadingPromise;
  }

  profilesLoadingPromise = (async () => {
    try {
      console.log('☁️ [DB] Reading profiles from blob storage:', PROFILES_BLOB_KEY);
      const blob = await head(PROFILES_BLOB_KEY);
      
      if (!blob) {
        console.log('📝 [DB] No profiles blob found, creating with default');
        const profiles = [defaultProfile];
        await writeProfiles(profiles);
        return profiles;
      }

      console.log('📥 [DB] Fetching profiles blob from:', blob.url);
      const response = await fetch(blob.url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profiles: ${response.statusText}`);
      }

      const profiles = (await response.json()) as ProfileRow[];
      console.log('✅ [DB] Loaded profiles from blob:', profiles.length);
      return ensureDefaultProfile(profiles);
    } catch (error) {
      console.error('❌ [DB] Error reading profiles from blob:', error);
      const profiles = [defaultProfile];
      await writeProfiles(profiles);
      return profiles;
    }
  })();

  cachedProfiles = await profilesLoadingPromise;
  profilesLoadingPromise = null;
  return cachedProfiles;
}

async function writeProfiles(profiles: ProfileRow[]): Promise<void> {
  const profilesWithDefault = ensureDefaultProfile(profiles);
  
  if (hasVercelBlobStorage) {
    console.log('☁️ [DB] Writing profiles to blob storage:', profilesWithDefault.length);
    try {
      await put(PROFILES_BLOB_KEY, JSON.stringify(profilesWithDefault, null, 2), {
        access: "public",
        addRandomSuffix: false,
      });
      console.log('✅ [DB] Profiles written to blob successfully');
    } catch (error) {
      console.error('❌ [DB] Failed to write profiles to blob:', error);
      throw error;
    }
  } else {
    console.log('📂 [DB] Writing profiles to local file');
    try {
      await fs.writeFile(PROFILES_LOCAL_PATH, JSON.stringify(profilesWithDefault, null, 2), 'utf-8');
      console.log('✅ [DB] Profiles written to local file successfully');
    } catch (error) {
      console.error('❌ [DB] Failed to write profiles to local file:', error);
    }
  }

  cachedProfiles = profilesWithDefault;
}

function ensureDefaultProfile(profiles: ProfileRow[]): ProfileRow[] {
  const existing = profiles.find(p => p.id === defaultProfile.id);
  if (existing) return profiles;
  return [defaultProfile, ...profiles];
}

// ============================================
// PLANS STORAGE
// ============================================

async function readPlans(): Promise<PlanRow[]> {
  if (!hasVercelBlobStorage) {
    console.log('📂 [DB] Using local file storage for plans');
    try {
      const data = await fs.readFile(PLANS_LOCAL_PATH, 'utf-8');
      return JSON.parse(data) as PlanRow[];
    } catch (error) {
      console.warn('⚠️ [DB] No local plans file, returning empty array');
      return [];
    }
  }

  if (cachedPlans) {
    console.log('💾 [DB] Returning cached plans:', cachedPlans.length);
    return cachedPlans;
  }

  if (plansLoadingPromise) {
    console.log('⏳ [DB] Waiting for plans loading promise');
    return plansLoadingPromise;
  }

  plansLoadingPromise = (async () => {
    try {
      console.log('☁️ [DB] Reading plans from blob storage:', PLANS_BLOB_KEY);
      const blob = await head(PLANS_BLOB_KEY);
      
      if (!blob) {
        console.log('📝 [DB] No plans blob found, returning empty array');
        return [];
      }

      console.log('📥 [DB] Fetching plans blob from:', blob.url);
      const response = await fetch(blob.url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch plans: ${response.statusText}`);
      }

      const plans = (await response.json()) as PlanRow[];
      console.log('✅ [DB] Loaded plans from blob:', plans.length);
      return plans;
    } catch (error) {
      console.error('❌ [DB] Error reading plans from blob:', error);
      return [];
    }
  })();

  cachedPlans = await plansLoadingPromise;
  plansLoadingPromise = null;
  return cachedPlans;
}

async function writePlans(plans: PlanRow[]): Promise<void> {
  if (hasVercelBlobStorage) {
    console.log('☁️ [DB] Writing plans to blob storage:', plans.length);
    try {
      await put(PLANS_BLOB_KEY, JSON.stringify(plans, null, 2), {
        access: "public",
        addRandomSuffix: false,
      });
      console.log('✅ [DB] Plans written to blob successfully');
    } catch (error) {
      console.error('❌ [DB] Failed to write plans to blob:', error);
      throw error;
    }
  } else {
    console.log('📂 [DB] Writing plans to local file');
    try {
      await fs.writeFile(PLANS_LOCAL_PATH, JSON.stringify(plans, null, 2), 'utf-8');
      console.log('✅ [DB] Plans written to local file successfully');
    } catch (error) {
      console.error('❌ [DB] Failed to write plans to local file:', error);
    }
  }

  cachedPlans = plans;
}

// ============================================
// PUBLIC API
// ============================================

export const db = {
  // Profiles
  async getProfiles(): Promise<ProfileRow[]> {
    return (await readProfiles()).sort((a, b) => 
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
  },

  async getProfile(id: string): Promise<ProfileRow | null> {
    const profiles = await readProfiles();
    return profiles.find((profile) => profile.id === id) ?? null;
  },

  async saveProfile(profile: ProfileRow) {
    console.log('💾 [DB] Saving profile:', profile.id, profile.name);
    const payload = { 
      ...profile, 
      createdAt: profile.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (payload.ui) {
      payload.ui = {
        ...payload.ui,
        createdAt: payload.createdAt ?? payload.ui.createdAt ?? new Date().toISOString(),
        updatedAt: payload.updatedAt,
      };
    }

    const profiles = await readProfiles();
    const filtered = profiles.filter((p) => p.id !== profile.id);
    await writeProfiles([payload, ...filtered]);
    console.log('✅ [DB] Profile saved successfully');
  },

  async updateProfile(profile: ProfileRow) {
    console.log('🔄 [DB] Updating profile:', profile.id, profile.name);
    const payload = { 
      ...profile, 
      updatedAt: new Date().toISOString(),
    };
    
    if (payload.ui) {
      payload.ui = {
        ...payload.ui,
        updatedAt: payload.updatedAt,
      };
    }

    const profiles = await readProfiles();
    const filtered = profiles.filter((p) => p.id !== profile.id);
    await writeProfiles([payload, ...filtered]);
    console.log('✅ [DB] Profile updated successfully');
  },

  async deleteProfile(id: string) {
    console.log('🗑️ [DB] Deleting profile:', id);
    const profiles = await readProfiles();
    const filtered = profiles.filter((p) => p.id !== id);
    await writeProfiles(filtered);
    
    // Also delete associated plans
    const plans = await readPlans();
    const filteredPlans = plans.filter((p) => p.profileId !== id);
    await writePlans(filteredPlans);
    console.log('✅ [DB] Profile and associated plans deleted');
  },

  // Plans
  async getPlans(): Promise<PlanRow[]> {
    return (await readPlans()).sort((a, b) => 
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
  },

  async getPlan(planId: string): Promise<PlanRow | null> {
    const plans = await readPlans();
    return plans.find((plan) => plan.planId === planId) ?? null;
  },

  async savePlan(plan: PlanRow) {
    console.log('💾 [DB] Saving plan:', plan.planId, plan.planName);
    const plans = await readPlans();
    const filtered = plans.filter((p) => p.planId !== plan.planId);
    await writePlans([plan, ...filtered]);
    console.log('✅ [DB] Plan saved successfully');
  },

  async deletePlan(planId: string) {
    console.log('🗑️ [DB] Deleting plan:', planId);
    const plans = await readPlans();
    const filtered = plans.filter((p) => p.planId !== planId);
    await writePlans(filtered);
    console.log('✅ [DB] Plan deleted successfully');
  },

  // Cache management
  invalidateCache() {
    console.log('🔄 [DB] Invalidating cache');
    cachedProfiles = null;
    cachedPlans = null;
  },
};
