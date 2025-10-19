import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/utils/db";

const PayloadSchema = z.object({ id: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const { id } = PayloadSchema.parse(await req.json());
    if (id === "prof_anchit") {
      return NextResponse.json({ error: "Anchor profile cannot be removed." }, { status: 400 });
    }
    await db.deleteProfile(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("profiles:delete error", error);
    return NextResponse.json({ error: error.message ?? "Failed to delete profile" }, { status: 400 });
  }
}
