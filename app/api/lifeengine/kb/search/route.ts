import { NextResponse } from "next/server";
import { z } from "zod";
import foods from "@/lib/catalog/foods.json";
import yogaFlows from "@/lib/catalog/yogaFlows.json";

const SearchSchema = z.object({
  query: z.string().min(1),
  collection: z.enum(["foods", "yogaFlows"]),
});

// A simple in-memory search function.
// For a real-world application, you would use a more robust search solution
// like a vector database or a full-text search engine.
function searchCollection(collection: any[], query: string) {
  const lowerCaseQuery = query.toLowerCase();
  return collection.filter((item) => {
    const name = item.name?.toLowerCase() || "";
    const description = item.description?.toLowerCase() || "";
    return name.includes(lowerCaseQuery) || description.includes(lowerCaseQuery);
  });
}

export async function POST(req: Request) {
  try {
    const payload = SearchSchema.parse(await req.json());
    let results = [];

    if (payload.collection === "foods") {
      results = searchCollection(foods, payload.query);
    } else if (payload.collection === "yogaFlows") {
      results = searchCollection(yogaFlows, payload.query);
    }

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
