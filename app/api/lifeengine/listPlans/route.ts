import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    let query = supabase
      .from('plans')
      .select('*');

    if (profileId && profileId !== "all") {
      query = query.eq('profileId', profileId);
    }

    const { data: plans, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      profileId: plan.profileId,
      intakeId: plan.intakeId,
      dayCount: plan.planJson.days.length,
      createdAt: plan.createdAt,
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error("Error listing plans:", error);
    return NextResponse.json({ error: "Failed to list plans" }, { status: 500 });
  }
}
