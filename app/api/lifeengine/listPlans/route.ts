import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const globalState = globalThis as unknown as {
  __LIFEENGINE_PLANS__?: Map<string, any>;
};

if (!globalState.__LIFEENGINE_PLANS__) {
  globalState.__LIFEENGINE_PLANS__ = new Map<string, any>();
}

const PLAN_STORE = globalState.__LIFEENGINE_PLANS__;

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    let plans = [];
    if (supabase) {
      let query = supabase
        .from('plans')
        .select('*');

      if (profileId && profileId !== "all") {
        query = query.eq('profileId', profileId);
      }

      const { data, error } = await query;

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      plans = data;
    } else {
      plans = Array.from(PLAN_STORE.values());
      if (profileId && profileId !== "all") {
        plans = plans.filter(plan => plan.profileId === profileId);
      }
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
