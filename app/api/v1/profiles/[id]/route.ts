import { NextResponse } from "next/server";
import type { Profile } from "@/app/types/lifeengine";

// Demo profiles for Custom GPT Actions
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

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const profile = DEMO_PROFILES[id];

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}
