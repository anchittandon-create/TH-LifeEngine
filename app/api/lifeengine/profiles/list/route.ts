import { NextResponse } from "next/server";
export async function GET() {
  // demo profiles
  return NextResponse.json({ profiles: [
    { id: "prof_anchit", name: "Anchit", gender:"M", age:31, region:"IN", medical_flags:["pcod"] },
    { id: "prof_jane", name: "Jane", gender:"F", age:29, region:"IN", medical_flags:["thyroid"] }
  ]});
}
