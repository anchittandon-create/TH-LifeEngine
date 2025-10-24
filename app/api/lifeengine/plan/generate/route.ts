import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({
    planId: "plan_" + Math.random().toString(36).slice(2, 8),
    plan: {
      meta: { title: "Demo Plan", duration_days: 7 },
      weekly_plan: [{
        week_index: 1,
        days: [{
          day_index: 1,
          yoga: ["sun_sal_6"],
          nutrition: { kcal_target: 1800, meals: ["poha_1"] }
        }]
      }]
    },
    warnings: [],
    quality_score: { overall: 0.9 }
  });
}
