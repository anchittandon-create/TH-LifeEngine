import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/planner";
import { verifyPlan } from "@/lib/ai/verifier";
import type { Intake, Plan, Profile } from "@/lib/ai/schemas";
import { createId } from "@/lib/utils/ids";
import { supabase } from "@/lib/supabase";

const globalState = globalThis as unknown as {
  __LIFEENGINE_PLANS__?: Map<string, any>;
};

if (!globalState.__LIFEENGINE_PLANS__) {
  globalState.__LIFEENGINE_PLANS__ = new Map<string, any>();
}

const PLAN_STORE = globalState.__LIFEENGINE_PLANS__;

export async function POST(request: Request) {
  try {
    const { profileId, intake } = await request.json() as { profileId: string; intake: Intake };

    if (!profileId || !intake) {
      return NextResponse.json({ error: "Missing profileId or intake payload" }, { status: 400 });
    }

    let profile = null;
    if (supabase) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError || !data) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      profile = data;
    } else {
      // For demo purposes, create a mock profile
      profile = {
        id: profileId,
        name: "Demo User",
        age: 30,
        gender: "other",
        goals: ["weight_loss"],
        healthConcerns: "",
        experience: "beginner",
        preferredTime: "flexible",
        subscriptionType: "quarterly",
      };
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
    const planData = {
      id: planId,
      profileId,
      intakeId: createId(),
      planJson: generated,
      planType: intake.primaryPlanType,
      createdAt: new Date().toISOString(),
    };

    if (supabase) {
      const { error: insertError } = await supabase
        .from('plans')
        .insert([planData]);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    } else {
      PLAN_STORE.set(planId, planData);
    }

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
