import { NextResponse } from "next/server";
import type { Plan } from "@/lib/ai/schemas";

const globalState = globalThis as unknown as {
  __LIFEENGINE_PLANS__?: Map<string, Plan>;
};

if (!globalState.__LIFEENGINE_PLANS__) {
  globalState.__LIFEENGINE_PLANS__ = new Map<string, Plan>();
}

const PLAN_STORE = globalState.__LIFEENGINE_PLANS__;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
  }

  try {
    const plan = PLAN_STORE.get(id);
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
