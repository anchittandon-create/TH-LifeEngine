import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlan } from "@/lib/ai/geminiPlanner";
import { verifyPlan } from "@/lib/ai/geminiVerifier";
import { db } from "@/lib/utils/db";
import { uid } from "@/lib/utils/ids";

const PlanRequestSchema = z.object({
  profileId: z.string().min(1),
  profile: z.object({
    age: z.number().int().min(10).max(100),
    sex: z.union([z.literal("F"), z.literal("M"), z.literal("Other")]),
    height: z.number().int().min(120).max(220),
    weight: z.number().int().min(30).max(200),
  }),
  goals: z.array(z.string().min(1)).min(1),
  modules: z.array(z.string()).default([]),
  dietary: z.object({
    type: z.string().min(1),
    cuisine: z.string().min(1),
    allergies: z.array(z.string()).default([]),
  }),
  flags: z.array(z.string()).default([]),
  timeBudget: z.number().int().min(15).max(180),
  level: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const payload = PlanRequestSchema.parse(await req.json());
    const draft = await generatePlan(payload);
    const { plan, warnings, confidence } = await verifyPlan(draft, {
      flags: payload.flags,
      dietary: payload.dietary,
      modules: payload.modules,
    });

    const planId = uid("plan_");
    await db.savePlan({
      planId,
      profileId: payload.profileId,
      confidence,
      warnings,
      planJSON: plan,
      days: plan.days.length,
    });

    return NextResponse.json({
      planId,
      weekPlan: plan.days,
      warnings,
      confidence,
    });
  } catch (error: any) {
    console.error("plan:generate error", error);
    return NextResponse.json({ error: error.message ?? "Failed to generate plan" }, { status: 400 });
  }
}
