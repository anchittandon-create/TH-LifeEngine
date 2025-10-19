import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    date: new Date().toISOString().slice(0, 10),
    tasks: ["Pranayama 10m", "Walk 20m", "Wind-down 30m"],
    meals: ["Veg upma", "Dal • Rice • Salad", "Curd + Roti"],
    hydrationMl: 1800,
    nudges: ["Add 200ml water to reach target"],
  });
}
