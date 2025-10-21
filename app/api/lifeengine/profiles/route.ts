import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createId } from "@/lib/utils/ids";
import type { Profile } from "@/lib/ai/schemas";

export async function GET() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: data });
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

    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data[0] });
  } catch (error) {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
