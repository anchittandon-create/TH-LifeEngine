import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/utils/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileIdParam = searchParams.get("profileId");
    const plans = profileIdParam
      ? await db.listPlans(z.string().min(1).parse(profileIdParam))
      : await db.listAllPlans();
    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("plan:list error", error);
    return NextResponse.json({ error: error.message ?? "Failed to load plans" }, { status: 400 });
  }
}
