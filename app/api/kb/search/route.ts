import { NextResponse } from "next/server";
import { z } from "zod";
import { search } from "@/lib/kb/store.bigquery";

const RequestSchema = z.object({
  query: z.string().min(3),
  filters: z
    .object({
      region: z.enum(["IN", "US", "EU", "Global"]).optional(),
      tags: z.array(z.string().min(1)).optional(),
      contraindications: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  k: z.number().int().min(1).max(50).default(20),
});

export async function POST(req: Request) {
  try {
    const payload = RequestSchema.parse(await req.json());
    const hits = await search(payload.query, payload.filters, payload.k);
    return NextResponse.json({ hits });
  } catch (error: any) {
    console.error("kb:search error", error);
    return NextResponse.json({ error: error?.message ?? "Failed to search knowledge base" }, { status: 400 });
  }
}
