import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    const plans =
      profileId && profileId !== "all"
        ? await db.listPlans(profileId)
        : await db.listAllPlans();

    const formattedPlans = plans.map((plan) => ({
      id: plan.planId,
      profileId: plan.profileId,
      planName: plan.planName || `Plan for User`, // ✅ Include plan name
      inputSummary: plan.inputSummary || "No details", // ✅ Include input summary
      intakeId: plan.planJSON.intakeId,
      goals: Array.isArray(plan.planJSON.goals) ? plan.planJSON.goals : [],
      dayCount: plan.planJSON.days?.length ?? plan.days ?? 0,
      createdAt: plan.createdAt ?? plan.planJSON.createdAt,
      source: plan.source || "gemini", // ✅ Include AI provider source
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error("Error listing plans:", error);
    return NextResponse.json({ error: "Failed to list plans" }, { status: 500 });
  }
}
