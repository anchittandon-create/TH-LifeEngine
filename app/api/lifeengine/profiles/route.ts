import { NextResponse } from "next/server";
import { createId } from "@/lib/utils/ids";
import type { Profile } from "@/lib/ai/schemas";

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
  try {
    const payload = (await request.json()) as Partial<Profile>;
    const id = payload.id ?? createId();
    const profile: Profile = {
      id,
      name: payload.name ?? "Unnamed",
      gender: payload.gender ?? "other",
      age: payload.age ?? 25,
      height: payload.height ?? 170,
      weight: payload.weight ?? 70,
      activityLevel: payload.activityLevel ?? "moderate",
      goals: payload.goals ?? [],
      flags: payload.flags ?? [],
    };

    PROFILE_STORE.set(id, profile);
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  PROFILE_STORE.delete(id);
  return NextResponse.json({ ok: true });
}
