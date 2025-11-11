import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Clear session cookie
    await clearSessionCookie();

    console.log('[Auth] User logged out:', {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
