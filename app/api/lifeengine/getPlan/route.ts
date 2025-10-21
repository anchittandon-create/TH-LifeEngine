import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const globalState = globalThis as unknown as {
  __LIFEENGINE_PLANS__?: Map<string, any>;
};

if (!globalState.__LIFEENGINE_PLANS__) {
  globalState.__LIFEENGINE_PLANS__ = new Map<string, any>();
}

const PLAN_STORE = globalState.__LIFEENGINE_PLANS__;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
  }

  try {
    let plan = null;
    if (supabase) {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
      plan = data;
    } else {
      plan = PLAN_STORE.get(id);
      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }
    }

    return NextResponse.json({
      plan: plan.planJson,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
