import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";
import { uid } from "@/lib/utils/ids";

export async function POST(req: Request) {
  const body = await req.json();
  const id = uid("prof");
  
  // Create a full profile object with default values
  const newProfile = {
    id,
    name: body.name || "New Profile",
    demographics: body.demographics || { age: 30, sex: "F" },
    contact: {},
    lifestyle: {},
    health: {},
    nutrition: {},
    schedule: {},
    equipment: [],
    preferences: {},
    coachingNotes: "",
    createdAt: new Date().toISOString(),
  };

  await db.saveProfile(newProfile);
  return NextResponse.json({ ok: true, id });
}
