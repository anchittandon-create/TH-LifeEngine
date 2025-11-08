import { NextResponse } from "next/server";
import type { Profile } from "@/app/types/lifeengine";
import { db } from "@/lib/utils/db";

// Demo profiles for Custom GPT Actions (fallback for testing)
const DEMO_PROFILES: Record<string, Profile> = {
  "ritika-001": {
    profile_id: "ritika-001",
    name: "Ritika",
    age: 34,
    gender: "female",
    location: "Mumbai",
    goal: "weight loss and anxiety reduction",
    plan_type: ["combined", "yoga", "diet"],
    preferred_time: "evening",
    diet_type: "vegetarian",
    activity_level: "moderate",
    work_schedule: "10am-7pm",
    sleep_hours: 5,
    stress_level: "high",
    chronic_conditions: ["PCOS"],
    mental_state: "stressed and low motivation",
    has_equipment: false,
    language: "English",
  },
  "demo-002": {
    profile_id: "demo-002",
    name: "Arjun",
    age: 28,
    gender: "male",
    location: "Bangalore",
    goal: "build core strength and improve flexibility",
    plan_type: ["yoga", "holistic"],
    preferred_time: "morning",
    diet_type: "vegetarian",
    activity_level: "active",
    work_schedule: "9am-6pm",
    sleep_hours: 7,
    stress_level: "medium",
    chronic_conditions: [],
    mental_state: "motivated",
    has_equipment: true,
    language: "English",
  },
};

/**
 * Convert database profile format to Custom GPT API format
 */
function convertToApiProfile(dbProfile: any): Profile {
  return {
    profile_id: dbProfile.id,
    name: dbProfile.name || dbProfile.ui?.name || "User",
    age: dbProfile.age || dbProfile.demographics?.age || dbProfile.ui?.age || 30,
    gender: (dbProfile.gender || dbProfile.demographics?.sex || dbProfile.ui?.gender || "other").toLowerCase(),
    location: dbProfile.contact?.location || "Global",
    goal: Array.isArray(dbProfile.goals) 
      ? dbProfile.goals.join(", ") 
      : dbProfile.ui?.goals?.[0] || dbProfile.lifestyle?.primaryGoal || "general wellness",
    plan_type: Array.isArray(dbProfile.ui?.planTypes) 
      ? dbProfile.ui.planTypes 
      : ["combined"],
    preferred_time: dbProfile.preferredTime || dbProfile.ui?.preferredTime || "flexible",
    diet_type: dbProfile.nutrition?.dietType || "vegetarian",
    activity_level: dbProfile.lifestyle?.activityLevel || "moderate",
    work_schedule: dbProfile.schedule?.notes || "9am-5pm",
    sleep_hours: dbProfile.health?.sleepHours || 7,
    stress_level: dbProfile.health?.stressLevel || "medium",
    chronic_conditions: dbProfile.health?.chronicConditions || [],
    mental_state: dbProfile.health?.mentalState || "balanced",
    has_equipment: Array.isArray(dbProfile.equipment) && dbProfile.equipment.length > 0,
    language: "English",
  };
}

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    // First check if it's a demo profile
    if (DEMO_PROFILES[id]) {
      console.log(`[v1/profiles] Returning demo profile: ${id}`);
      return NextResponse.json(DEMO_PROFILES[id]);
    }

    // Try to fetch real profile from database
    console.log(`[v1/profiles] Fetching real profile from DB: ${id}`);
    const dbProfile = await db.getProfile(id);

    if (!dbProfile) {
      console.log(`[v1/profiles] Profile not found: ${id}`);
      return NextResponse.json(
        { 
          error: "Profile not found", 
          message: `No profile found with ID: ${id}. Available demo profiles: ritika-001, demo-002` 
        }, 
        { status: 404 }
      );
    }

    // Convert to API format
    const apiProfile = convertToApiProfile(dbProfile);
    console.log(`[v1/profiles] Returning real profile: ${id} (${apiProfile.name})`);
    
    return NextResponse.json(apiProfile);
  } catch (error: any) {
    console.error(`[v1/profiles] Error fetching profile ${id}:`, error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
