import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateBmr, calculateTdee } from "@/lib/utils/formulas";
import type { ProfileRow } from "@/lib/utils/db";

// We expect a partial profile, but need the fields for TDEE calculation.
const IntakeProfileSchema = z.object({
  demographics: z.object({
    weight: z.number(),
    height: z.number(),
    age: z.number(),
    sex: z.enum(["F", "M", "Other"]),
  }),
  lifestyle: z.object({
    activityLevel: z.string(),
  }),
});

export async function POST(req: Request) {
  try {
    const profile = (await req.json()) as ProfileRow;

    const validation = IntakeProfileSchema.safeParse(profile);

    if (!validation.success) {
      return NextResponse.json({
        ok: false,
        error: "Missing required fields for TDEE calculation.",
        details: validation.error.flatten(),
      });
    }

    const { demographics, lifestyle } = validation.data;
    const bmr = calculateBmr(demographics);
    const tdee = calculateTdee(bmr, lifestyle.activityLevel);

    const enrichedProfile = {
      ...profile,
      derived: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
      },
    };

    return NextResponse.json({ ok: true, profile: enrichedProfile });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
