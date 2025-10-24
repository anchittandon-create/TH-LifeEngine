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
    const plan = await db.getPlan(parsedPlanId);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json({ plan });
  } catch (error: any) {
    console.error("plan:detail error", error);
    return NextResponse.json({ error: error.message ?? "Failed to load plan" }, { status: 400 });
  }
}
