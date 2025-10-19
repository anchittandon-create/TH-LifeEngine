import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profiles = await db.getProfiles();
    return NextResponse.json({ profiles });
  } catch (error) {
    console.error("profiles:list error", error);
    return NextResponse.json({ error: "Failed to load profiles" }, { status: 500 });
  }
}
