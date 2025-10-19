import { NextResponse } from 'next/server';
import { getPlans } from '@/lib/utils/store';

export async function GET() {
  const plans = getPlans();
  return NextResponse.json({ plans });
}