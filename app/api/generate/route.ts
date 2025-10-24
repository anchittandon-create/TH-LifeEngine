import { NextRequest, NextResponse } from 'next/server';
import { createId } from '@/lib/utils/ids';

// This is a simplified endpoint. For full functionality, use /api/lifeengine/generate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    // Create a simple response structure
    const planResponse = {
      id: createId(),
      profileId: body.profileId,
      planType: body.planType || 'general',
      createdAt: new Date().toISOString(),
      message: 'Plan generation simplified. Please use /api/lifeengine/generate for full functionality.'
    };

    return NextResponse.json(planResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}