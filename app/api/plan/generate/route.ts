import { NextResponse } from "next/server";
import { PlanSchema } from "@/lib/ai/schemas";
import { createFallbackPlan } from "@/lib/ai/samplePlan";

export const dynamic = "force-dynamic";

// STUB: This is a stub for the real API endpoint.
// It returns a sample plan after a 2-second delay.
export async function POST(req: Request) {
  console.log("Stubbing /api/plan/generate");
  await new Promise(resolve => setTimeout(resolve, 2000));
  const plan = PlanSchema.parse(createFallbackPlan('M')); // Default to male
  return NextResponse.json(plan);
}
