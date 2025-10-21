import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing plan id" }, { status: 400 });
  }

  try {
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      plan: plan.planJson,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
  }
}
