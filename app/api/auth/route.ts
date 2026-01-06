import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generate a session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Simple hash function for password comparison (timing-safe)
function verifyPassword(input: string, stored: string): boolean {
  if (!input || !stored) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(input),
      Buffer.from(stored)
    );
  } catch {
    return false;
  }
}

// Store active sessions (in-memory for simplicity - resets on server restart)
const activeSessions = new Map<string, { createdAt: number; expiresAt: number }>();

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

// Clean up expired sessions periodically
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
}

// POST: Login
export async function POST(request: NextRequest) {
  const requestId = `auth-${Date.now()}`;
  logger.auth.info('Login attempt', { requestId });

  try {
    const { password } = await request.json();
    const storedPassword = process.env.AUTH_PASSWORD;

    // Check if auth is configured
    if (!storedPassword) {
      logger.auth.warn('AUTH_PASSWORD not configured - allowing access', { requestId });
      // If no password is configured, allow access (for development)
      const token = generateSessionToken();
      activeSessions.set(token, {
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION,
      });
      
      return NextResponse.json({
        success: true,
        token,
        message: 'Authentication disabled - access granted',
        expiresAt: Date.now() + SESSION_DURATION,
      });
    }

    // Verify password
    if (!password) {
      logger.auth.warn('No password provided', { requestId });
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!verifyPassword(password.trim(), storedPassword)) {
      logger.auth.warn('Invalid password attempt', { requestId });
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateSessionToken();
    activeSessions.set(token, {
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION,
    });

    // Clean up old sessions
    cleanupExpiredSessions();

    logger.auth.info('Login successful', { requestId });

    return NextResponse.json({
      success: true,
      token,
      expiresAt: Date.now() + SESSION_DURATION,
    });
  } catch (error) {
    logger.auth.error('Login error', { requestId, error: error instanceof Error ? error : String(error) });
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// GET: Verify session
export async function GET(request: NextRequest) {
  const requestId = `auth-verify-${Date.now()}`;
  
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Check if auth is required
    const storedPassword = process.env.AUTH_PASSWORD;
    if (!storedPassword) {
      logger.auth.debug('AUTH_PASSWORD not configured - auth disabled', { requestId });
      return NextResponse.json({
        authenticated: true,
        authRequired: false,
        message: 'Authentication is disabled',
      });
    }

    if (!token) {
      logger.auth.debug('No token provided', { requestId });
      return NextResponse.json({
        authenticated: false,
        authRequired: true,
      });
    }

    const session = activeSessions.get(token);
    if (!session) {
      logger.auth.debug('Invalid or expired token', { requestId });
      return NextResponse.json({
        authenticated: false,
        authRequired: true,
        error: 'Session expired or invalid',
      });
    }

    // Check if session expired
    if (session.expiresAt < Date.now()) {
      activeSessions.delete(token);
      logger.auth.debug('Session expired', { requestId });
      return NextResponse.json({
        authenticated: false,
        authRequired: true,
        error: 'Session expired',
      });
    }

    logger.auth.debug('Session valid', { requestId });
    return NextResponse.json({
      authenticated: true,
      authRequired: true,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    logger.auth.error('Session verification error', { requestId, error: error instanceof Error ? error : String(error) });
    return NextResponse.json(
      { authenticated: false, authRequired: true, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

// DELETE: Logout
export async function DELETE(request: NextRequest) {
  const requestId = `auth-logout-${Date.now()}`;
  
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token && activeSessions.has(token)) {
      activeSessions.delete(token);
      logger.auth.info('Logout successful', { requestId });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.auth.error('Logout error', { requestId, error: error instanceof Error ? error : String(error) });
    return NextResponse.json({ success: true }); // Still return success
  }
}

