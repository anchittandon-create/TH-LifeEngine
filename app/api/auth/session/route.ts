import { NextRequest, NextResponse } from 'next/server';
import { getSessionInfo } from '@/lib/auth';

/**
 * Get current session status
 * Useful for debugging and client-side auth checks
 */
export async function GET(req: NextRequest) {
  try {
    const sessionInfo = await getSessionInfo();
    
    return NextResponse.json({
      ...sessionInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Auth] Session check error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check session' },
      { status: 500 }
    );
  }
}
