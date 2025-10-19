import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
  }

  try {
    const planRecord = await db.getPlan(id);
    if (!planRecord) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      planId: id,
      plan: planRecord.planJSON,
      warnings: planRecord.warnings,
      analytics: planRecord.planJSON.analytics,
      profileId: planRecord.profileId,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
