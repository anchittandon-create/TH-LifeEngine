import { NextResponse } from "next/server";
import { createId } from "@/lib/utils/ids";
import type { Profile } from "@/lib/domain/profile";

const globalState = globalThis as unknown as {
  __LIFEENGINE_PROFILES__?: Map<string, Profile>;
};

if (!globalState.__LIFEENGINE_PROFILES__) {
  globalState.__LIFEENGINE_PROFILES__ = new Map<string, Profile>();
}

const PROFILE_STORE = globalState.__LIFEENGINE_PROFILES__;

export async function GET() {
  return NextResponse.json({ profiles: Array.from(PROFILE_STORE.values()) });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Profile>;
  const id = payload.id ?? createId();
  const profile: Profile = {
    id,
    name: payload.name ?? "Unnamed",
    gender: (payload.gender as Profile["gender"]) ?? "Other",
    age: Number(payload.age ?? 0),
    height_cm: payload.height_cm,
    weight_kg: payload.weight_kg,
    region: payload.region,
    medical_flags: payload.medical_flags ?? [],
    activity_level: payload.activity_level,
    dietary: payload.dietary,
    preferences: payload.preferences,
    availability: payload.availability,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };

  PROFILE_STORE.set(id, profile);
  return NextResponse.json({ profile });
}

export async function DELETE(request: Request) {
  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  PROFILE_STORE.delete(id);
  return NextResponse.json({ ok: true });
}
