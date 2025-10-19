import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/utils/db";

export async function GET(req: NextRequest) {
  const profileId = req.nextUrl.searchParams.get("profileId");
  
  if (profileId && profileId !== "all") {
    const plans = await db.listPlans(profileId);
    return NextResponse.json({ plans });
  } else {
    const plans = await db.listAllPlans();
    return NextResponse.json({ plans });
  }
}
