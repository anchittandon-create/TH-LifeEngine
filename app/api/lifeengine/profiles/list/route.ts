import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    profiles: [
      { id: "prof_anchit", name: "Anchit", gender: "M", age: 31, region: "IN", medical_flags: ["hypertension"], demographics: { age: 31, sex: "M" } },
      { id: "prof_jane", name: "Jane", gender: "F", age: 29, region: "IN", medical_flags: ["pcod"], demographics: { age: 29, sex: "F" } }
    ]
  });
}
