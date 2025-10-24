import { NextRequest, NextResponse } from 'next/server';

// Simple API key authentication
const API_KEY = process.env.API_KEY || 'lifeengine-dev-key-2025';

export function middleware(request: NextRequest) {
  // Apply authentication to API routes
  if (request.nextUrl.pathname.startsWith('/api/lifeengine/')) {
    const authHeader = request.headers.get('authorization');
    const apiKey = request.headers.get('x-api-key');
    
    // Check for API key in headers
    if (!apiKey && !authHeader) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please provide API key in x-api-key header or Authorization header',
          hint: 'For development, use: x-api-key: lifeengine-dev-key-2025'
        },
        { status: 401 }
      );
    }
    
    // Validate API key
    const providedKey = apiKey || authHeader?.replace('Bearer ', '');
    if (providedKey !== API_KEY) {
      return NextResponse.json(
        { 
          error: 'Invalid API key',
          message: 'The provided API key is not valid'
        },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/lifeengine/:path*',
  ],
};