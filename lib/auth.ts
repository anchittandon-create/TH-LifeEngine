/**
 * Simple Authentication Utility
 * Hardcoded credentials for single-user access
 */

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Hardcoded credentials
const VALID_USERNAME = 'Anchit';
const VALID_PASSWORD = 'AnchitAnya';

// Session configuration
const SESSION_COOKIE_NAME = 'th-session';
const SESSION_SECRET = 'th-lifeengine-secret-2025'; // In production, use env variable
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Validate login credentials
 */
export function validateCredentials(username: string, password: string): boolean {
  return username === VALID_USERNAME && password === VALID_PASSWORD;
}

/**
 * Create a session token (simple base64 encoding for demo)
 * In production, use proper JWT or session management
 */
export function createSessionToken(): string {
  const timestamp = Date.now();
  const token = Buffer.from(`${SESSION_SECRET}:${timestamp}`).toString('base64');
  return token;
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [secret, timestamp] = decoded.split(':');
    
    // Check if secret matches
    if (secret !== SESSION_SECRET) {
      return false;
    }
    
    // Check if token is not expired (7 days)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = SESSION_MAX_AGE * 1000; // Convert to milliseconds
    
    return tokenAge < maxAge;
  } catch (error) {
    return false;
  }
}

/**
 * Set session cookie (server-side)
 */
export async function setSessionCookie() {
  const token = createSessionToken();
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear session cookie (logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionToken?.value) {
    return false;
  }
  
  return verifySessionToken(sessionToken.value);
}

/**
 * Check if request is authenticated (middleware)
 */
export function isRequestAuthenticated(request: NextRequest): boolean {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME);
  
  if (!sessionToken?.value) {
    return false;
  }
  
  return verifySessionToken(sessionToken.value);
}

/**
 * Get session info for logging/debugging
 */
export async function getSessionInfo() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionToken?.value) {
    return { authenticated: false };
  }
  
  try {
    const decoded = Buffer.from(sessionToken.value, 'base64').toString('utf-8');
    const [, timestamp] = decoded.split(':');
    const createdAt = new Date(parseInt(timestamp));
    const expiresAt = new Date(parseInt(timestamp) + SESSION_MAX_AGE * 1000);
    
    return {
      authenticated: true,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
}
