import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";

export async function GET() {
  const profiles = await db.getProfiles();
  const simplifiedProfiles = profiles.map(p => ({
    id: p.id,
    name: p.name,
    gender: p.demographics?.sex,
    age: p.demographics?.age,
    region: p.contact?.location?.split(',').pop()?.trim(),
    medical_flags: p.health?.flags,
  }));
  return NextResponse.json({ profiles: simplifiedProfiles });
}
