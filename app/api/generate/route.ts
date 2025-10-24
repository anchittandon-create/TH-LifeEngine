import { NextRequest, NextResponse } from 'next/server';
import { generatePlan } from '@/lib/ai/planner';
import { verifyPlan } from '@/lib/ai/verifier';
import { savePlan } from '@/lib/utils/store';
import { createId } from '@/lib/utils/ids';
import type { Intake } from '@/lib/domain/intake';

export async function POST(request: NextRequest) {
  const intake: Intake = await request.json();
  const plan = await generatePlan(intake);
  if (!verifyPlan(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }
  const planWithId = { ...plan, id: createId(), createdAt: new Date().toISOString() };
  savePlan(planWithId);
  return NextResponse.json(planWithId);
}