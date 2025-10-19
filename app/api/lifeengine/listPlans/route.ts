import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileFilter = searchParams.get("profileId");

    const plans = profileFilter && profileFilter !== "all"
      ? await db.listPlans(profileFilter)
      : await db.listAllPlans();

    const formattedPlans = plans.map((plan) => ({
      id: plan.planId,
      profileId: plan.profileId,
      title: plan.planJSON.meta?.title || 'Untitled Plan',
      createdAt: plan.createdAt ? new Date(plan.createdAt).getTime() : Date.now(),
      goals: plan.planJSON.meta?.goals || [],
      warnings: plan.warnings.length,
      analytics: plan.planJSON.analytics,
    })).sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error("Error listing plans:", error);
    return NextResponse.json({ error: "Failed to list plans" }, { status: 500 });
  }
}
