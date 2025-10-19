import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ ok:true, id: "prof_"+Math.random().toString(36).slice(2,8) }); }
