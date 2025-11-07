import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
  }

  try {
    const plan = await db.getPlan(id);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Return plan in consistent format
    return NextResponse.json({
      plan: {
        id: plan.planJSON.id || plan.planId,
        profileId: plan.profileId,
        intakeId: plan.planJSON.intakeId || plan.profileId,
        goals: plan.planJSON.goals || [],
        createdAt: plan.planJSON.createdAt || plan.createdAt,
        days: plan.planJSON.days || [],
      },
      warnings: plan.warnings || [],
      analytics: plan.analytics || {},
      costMetrics: plan.costMetrics || {},
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
