import { NextResponse } from "next/server";
import { z } from "zod";
import { uid } from "@/lib/utils/ids";
import { db } from "@/lib/utils/db";

const PayloadSchema = z.object({
  name: z.string().trim().min(1),
  demographics: z
    .object({
      age: z.number().int().min(10).max(100).optional(),
      sex: z.enum(["F", "M", "Other"]).optional(),
      height: z.number().int().min(100).max(220).optional(),
      weight: z.number().int().min(25).max(200).optional(),
    })
    .partial()
    .optional(),
  contact: z
    .object({
      email: z.string().email().optional(),
      phone: z.string().min(5).optional(),
      location: z.string().min(1).optional(),
    })
    .partial()
    .optional(),
  lifestyle: z
    .object({
      occupation: z.string().optional(),
      timeZone: z.string().optional(),
      activityLevel: z.string().optional(),
      primaryGoal: z.string().optional(),
    })
    .partial()
    .optional(),
});

export async function POST(req: Request) {
  try {
    const payload = PayloadSchema.parse(await req.json());
    const id = uid("prof_");
    await db.saveProfile({
      id,
      name: payload.name,
      demographics: payload.demographics ?? {},
      contact: payload.contact ?? {},
      lifestyle: payload.lifestyle ?? {},
    });
    return NextResponse.json({ id, ok: true });
  } catch (error: any) {
    console.error("profiles:create error", error);
    return NextResponse.json({ error: error.message ?? "Failed to create profile" }, { status: 400 });
  }
}
