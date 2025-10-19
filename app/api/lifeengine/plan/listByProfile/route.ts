import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ plans: [
    { planId:"plan_abc123", profileId:"prof_anchit", days:7, confidence:0.9, warnings:[] }
  ]});
}
