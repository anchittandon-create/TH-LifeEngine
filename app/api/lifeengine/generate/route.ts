import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/planner";
import { verifyPlan } from "@/lib/ai/verifier";
import type { Intake, Plan, Profile } from "@/lib/ai/schemas";
import { createId } from "@/lib/utils/ids";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { profileId, intake } = await request.json() as { profileId: string; intake: Intake };

    if (!profileId || !intake) {
      return NextResponse.json({ error: "Missing profileId or intake payload" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
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
    const planData = {
      id: planId,
      profileId,
      intakeId: createId(),
      planJson: generated,
      planType: intake.primaryPlanType,
      createdAt: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('plans')
      .insert([planData]);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
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
