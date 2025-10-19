import { NextResponse } from "next/server";
import type { Intake } from "@/lib/domain/intake";
import type { Plan } from "@/lib/domain/plan";

type PlanRecord = {
  plan: Plan;
  warnings: string[];
  analytics: Plan["analytics"];
  profileId: string;
  createdAt: number;
  intake: Intake;
};

const globalState = globalThis as unknown as {
  __LIFEENGINE_RUNTIME__?: {
    plans: Map<string, PlanRecord>;
  };
};

if (!globalState.__LIFEENGINE_RUNTIME__) {
  globalState.__LIFEENGINE_RUNTIME__ = {
    plans: new Map<string, PlanRecord>(),
  };
}

const PLAN_STORE = globalState.__LIFEENGINE_RUNTIME__.plans;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
  }
  const record = PLAN_STORE.get(id);
  if (!record) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  return NextResponse.json({
    planId: id,
    plan: record.plan,
    warnings: record.warnings,
    analytics: record.analytics,
    profileId: record.profileId,
  });
}
