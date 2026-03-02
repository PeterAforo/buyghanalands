/**
 * CSRF Protection Utility
 * Provides CSRF token generation and validation for state-changing operations
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Set CSRF token in cookies (call this in layout or page)
 */
export async function setCSRFCookie(): Promise<string> {
  const token = generateCSRFToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: CSRF_TOKEN_EXPIRY / 1000,
    path: "/",
  });
  
  return token;
}

/**
 * Get CSRF token from cookies
 */
export async function getCSRFToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

/**
 * Validate CSRF token from request
 * Compares token from header/body with token from cookie
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  
  if (!cookieToken) {
    return false;
  }
  
  // Get token from header (preferred) or body
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  if (!headerToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * CSRF validation middleware for API routes
 * Use this wrapper for state-changing operations (POST, PUT, DELETE, PATCH)
 */
export function withCSRFProtection<T>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    // Skip CSRF check for GET, HEAD, OPTIONS
    const method = request.method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      return handler(request, context);
    }
    
    // Skip CSRF for webhook endpoints (they use their own auth)
    const pathname = new URL(request.url).pathname;
    if (pathname.includes("/webhook") || pathname.includes("/callback")) {
      return handler(request, context);
    }
    
    // Validate CSRF token
    try {
      const isValid = await validateCSRFToken(request);
      
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid or missing CSRF token" },
          { status: 403 }
        );
      }
    } catch {
      // If tokens are different lengths, timingSafeEqual throws
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    
    return handler(request, context);
  };
}

/**
 * Create response headers with CSRF token for client
 */
export function createCSRFHeaders(token: string): Record<string, string> {
  return {
    "X-CSRF-Token": token,
  };
}
