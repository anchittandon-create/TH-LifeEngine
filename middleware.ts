import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting for API endpoints (in-memory)
const rateLimitBuckets = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW_MS = 15_000; // 15 seconds
const RATE_LIMIT_MAX_REQUESTS = 15;

export function middleware(request: NextRequest) {
  // Rate limiting for /api/v1/plans POST (Custom GPT Actions protection)
  if (
    request.nextUrl.pathname === '/api/v1/plans' &&
    request.method === 'POST'
  ) {
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
    const now = Date.now();
    
    const bucket = rateLimitBuckets.get(ip) || { count: 0, timestamp: now };
    
    // Reset bucket if window has passed
    if (now - bucket.timestamp > RATE_LIMIT_WINDOW_MS) {
      bucket.count = 0;
      bucket.timestamp = now;
    }
    
    bucket.count += 1;
    rateLimitBuckets.set(ip, bucket);
    
    // Check if rate limit exceeded
    if (bucket.count > RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
  }

  const response = NextResponse.next();

  // Add responsive and performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Enable caching for static assets
  if (request.nextUrl.pathname.startsWith('/assets') || 
      request.nextUrl.pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)', // Include API routes
  ],
};
