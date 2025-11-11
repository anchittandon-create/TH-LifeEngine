import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials
    const isValid = validateCredentials(username, password);

    if (!isValid) {
      // Log failed attempt (for security monitoring)
      console.warn('[Auth] Failed login attempt:', {
        username,
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Set session cookie
    await setSessionCookie();

    // Log successful login
    console.log('[Auth] Successful login:', {
      username,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Login successful',
        user: { username } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
