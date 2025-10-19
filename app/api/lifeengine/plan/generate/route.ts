import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const body = await req.json();
  const mock = {
    planId: "plan_"+Math.random().toString(36).slice(2,8),
    weekPlan: [{ day:1, yoga:["sun_sal_6"], meals:["poha_1"] }],
    warnings: [],
    confidence: 0.92
  };
  return NextResponse.json(mock);
}
