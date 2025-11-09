import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/utils/db";

const QuerySchema = z.object({
  planId: z.string().min(1),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");
    const { planId: parsedPlanId } = QuerySchema.parse({ planId });
    const planRow = await db.getPlan(parsedPlanId);
    if (!planRow) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    
    // Check if this is a Gemini/rule-based plan (has planJSON with days array)
    // If so, return the planJSON content directly for compatibility
    if (planRow.planJSON && planRow.planJSON.days && !(planRow.planJSON as any).weekly_schedule) {
      return NextResponse.json({ 
        plan: planRow.planJSON,
        planName: planRow.planName,
        source: planRow.source,
        warnings: planRow.warnings,
        analytics: planRow.analytics,
        costMetrics: planRow.costMetrics,
      });
    }
    
    // Otherwise return the full plan object (custom GPT format)
    return NextResponse.json({ plan: planRow });
  } catch (error: any) {
    console.error("plan:detail error", error);
    return NextResponse.json({ error: error.message ?? "Failed to load plan" }, { status: 400 });
  }
}
