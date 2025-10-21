import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
  if (supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profiles: data });
  } else {
    return NextResponse.json({ profiles: Array.from(PROFILE_STORE.values()) });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<Profile>;
    const id = payload.id ?? createId();
    const profile: Profile = {
      id,
      name: payload.name ?? "Unnamed",
      age: payload.age ?? 25,
      gender: payload.gender ?? "other",
      goals: payload.goals ?? [],
      healthConcerns: payload.healthConcerns ?? "",
      experience: payload.experience ?? "beginner",
      preferredTime: payload.preferredTime ?? "flexible",
      subscriptionType: payload.subscriptionType ?? "quarterly",
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ profile: data[0] });
    } else {
      PROFILE_STORE.set(id, profile);
      return NextResponse.json({ profile });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  if (supabase) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    PROFILE_STORE.delete(id);
  }

  return NextResponse.json({ ok: true });
}
