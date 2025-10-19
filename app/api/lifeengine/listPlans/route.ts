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
  const profileFilter = searchParams.get("profileId");

  const plans = Array.from(PLAN_STORE.entries())
    .filter(([_, record]) =>
      profileFilter && profileFilter !== "all"
        ? record.profileId === profileFilter
        : true
    )
    .map(([id, record]) => ({
      id,
      profileId: record.profileId,
      title: record.plan.meta?.title || 'Untitled Plan',
      createdAt: record.createdAt,
      goals: record.plan.meta?.goals || [],
      warnings: record.warnings.length,
      analytics: record.analytics,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);

  return NextResponse.json({ plans });
}
