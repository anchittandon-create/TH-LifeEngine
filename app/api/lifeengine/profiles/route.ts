import { NextResponse } from "next/server";
import type { Profile } from "@/lib/domain/profile";
import { createId } from "@/lib/utils/ids";

const PROFILE_STORE = new Map<string, Profile>();

export async function GET() {
  return NextResponse.json({
    profiles: Array.from(PROFILE_STORE.values()),
    syncHint: "mirror-local",
  });
}

export async function POST(request: Request) {
  const { profile } = await request.json();
  if (!profile) {
    return NextResponse.json({ error: "Missing profile payload" }, { status: 400 });
  }
  const nextProfile: Profile = {
    ...profile,
    id: profile.id ?? createId("prof"),
  };
  PROFILE_STORE.set(nextProfile.id, nextProfile);
  return NextResponse.json({
    profile: nextProfile,
    syncHint: "persist-local",
  });
}

export async function PUT(request: Request) {
  const { profile } = await request.json();
  if (!profile?.id) {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }
  const merged: Profile = {
    ...(PROFILE_STORE.get(profile.id) ?? profile),
    ...profile,
  };
  PROFILE_STORE.set(merged.id, merged);
  return NextResponse.json({
    profile: merged,
    syncHint: "persist-local",
  });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }
  PROFILE_STORE.delete(id);
  return NextResponse.json({ ok: true, syncHint: "remove-local" });
}
