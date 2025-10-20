import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/planner";
import { verifyPlan } from "@/lib/ai/verifier";
import type { Intake, Plan, Profile } from "@/lib/ai/schemas";
import { createId } from "@/lib/utils/ids";

const globalState = globalThis as unknown as {
  __LIFEENGINE_PLANS__?: Map<string, Plan>;
  __LIFEENGINE_PROFILES__?: Map<string, Profile>;
};

if (!globalState.__LIFEENGINE_PLANS__) {
  globalState.__LIFEENGINE_PLANS__ = new Map<string, Plan>();
}

if (!globalState.__LIFEENGINE_PROFILES__) {
  globalState.__LIFEENGINE_PROFILES__ = new Map<string, Profile>();
}

const PLAN_STORE = globalState.__LIFEENGINE_PLANS__;
const PROFILE_STORE = globalState.__LIFEENGINE_PROFILES__;

export async function POST(request: Request) {
  try {
    const { profileId, intake } = await request.json() as { profileId: string; intake: Intake };

    if (!profileId || !intake) {
      return NextResponse.json({ error: "Missing profileId or intake payload" }, { status: 400 });
    }

    const profile = PROFILE_STORE.get(profileId);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const generated = await generatePlan(profile, intake);
    const verification = verifyPlan(generated, profile);

    if (!verification.safe) {
      return NextResponse.json({
        error: "Plan generation failed safety checks",
        issues: verification.issues
      }, { status: 400 });
    }

    const planId = createId();
    PLAN_STORE.set(planId, generated);

    return NextResponse.json({
      planId,
      plan: generated,
      verification,
    });
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
