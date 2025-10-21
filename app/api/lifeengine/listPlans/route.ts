import { NextResponse } from "next/server";
import type { Plan } from "@/lib/ai/schemas";

export const dynamic = 'force-dynamic';

const globalState = globalThis as unknown as {
  __LIFEENGINE_PLANS__?: Map<string, Plan>;
};

if (!globalState.__LIFEENGINE_PLANS__) {
  globalState.__LIFEENGINE_PLANS__ = new Map<string, Plan>();
}

const PLAN_STORE = globalState.__LIFEENGINE_PLANS__;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    let plans = Array.from(PLAN_STORE.values());

    if (profileId && profileId !== "all") {
      plans = plans.filter(plan => plan.profileId === profileId);
    }

    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      profileId: plan.profileId,
      intakeId: plan.intakeId,
      dayCount: plan.days.length,
      createdAt: Date.now(), // Since we don't have createdAt in schema
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error("Error listing plans:", error);
    return NextResponse.json({ error: "Failed to list plans" }, { status: 500 });
  }
}
