import { NextRequest, NextResponse } from 'next/server';
import { getPlans } from '@/lib/utils/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }
  const plans = getPlans();
  const plan = plans.find(p => p.id === id);
  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
  }
  return NextResponse.json(plan);
}