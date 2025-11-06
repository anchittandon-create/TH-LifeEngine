import { NextResponse } from "next/server";
import type { LifeEnginePlan } from "@/app/types/lifeengine";

type StoredPlanItem = { plan_id: string; plan: LifeEnginePlan };

// Access the global store
declare const __PLANS__: StoredPlanItem[] | undefined;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const profile_id = url.searchParams.get("profile_id");

    if (!profile_id) {
      return NextResponse.json(
        { error: "profile_id query parameter is required" },
        { status: 400 }
      );
    }

    // Access the global store
    const store: StoredPlanItem[] = (globalThis as any).__PLANS__ ?? [];

    // Filter plans by profile_id in metadata
    const matchingPlans = store.filter(
      (item) => item.plan?.metadata?.profile_id === profile_id
    );

    if (matchingPlans.length === 0) {
      return NextResponse.json(
        { error: "No plans found for this profile_id" },
        { status: 404 }
      );
    }

    // Return the most recent plan (last in array)
    const latestPlan = matchingPlans[matchingPlans.length - 1].plan;

    return NextResponse.json(latestPlan);
  } catch (error) {
    console.error("Error fetching latest plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
