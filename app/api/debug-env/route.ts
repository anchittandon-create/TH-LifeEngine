import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
    GOOGLE_API_KEY_LENGTH: process.env.GOOGLE_API_KEY?.length || 0,
    GOOGLE_API_KEY_PREFIX: process.env.GOOGLE_API_KEY?.substring(0, 10) || "none",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    hasBlob: !!process.env.BLOB_READ_WRITE_TOKEN,
  };

  return NextResponse.json(envVars);
}