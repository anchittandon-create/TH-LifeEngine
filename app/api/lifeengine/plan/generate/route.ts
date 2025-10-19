import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/geminiPlanner";
import { db } from "@/lib/utils/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const plan = await generatePlan(body);
  await db.savePlan({
    planId: plan.id,
    profileId: body.profileId,
    days: plan.days.length,
    confidence: 0.9, // This should be returned by the planner
    warnings: [], // This should be returned by the planner
    planJSON: plan,
  });
  return NextResponse.json(plan);
}
