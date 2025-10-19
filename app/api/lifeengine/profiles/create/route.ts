import { NextResponse } from "next/server";
import { db } from "@/lib/utils/db";
import { uid } from "@/lib/utils/ids";

export async function POST(req: Request) {
  const body = await req.json();
  const id = uid("prof");
  await db.saveProfile({
    id,
    name: body.name || "New Profile",
    demographics: body.demographics || {},
  });
  return NextResponse.json({ ok: true, id });
}
