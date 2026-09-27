/**
 * AUTH MODULE - Authentication Guards
 * Owner: Jai (Blue Team Lead)
 * DO NOT MODIFY BY OTHER TEAMS
 *
 * THIS IS THE ONLY FILE OTHER TEAMS IMPORT FROM.
 * They use: requireAuth() and requireRole()
 */

import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { verifyJwt, type JwtPayload } from "./jwt";
import type { UserRole } from "./roles";
import { getAccessibleModules } from "./roles";

/**
 * Custom authentication error class
 * Used to throw auth-related errors with HTTP status codes
 */
export class AuthError extends Error {
  constructor(
    public status: 401 | 403,
    message: string,
    public redirectTo?: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Require authentication - Verify JWT token from cookie
 * @param c - Hono context
 * @returns Promise<JwtPayload> - Decoded user data from JWT
 * @throws AuthError - If not authenticated (status: 401)
 */
export async function requireAuth(c: Context): Promise<JwtPayload> {
  const token = getCookie(c, "auth_token");

  if (!token) {
    throw new AuthError(401, "Not authenticated", "/login");
  }

  try {
    const payload = await verifyJwt(token);
    return payload;
  } catch (_error) {
    // Token is invalid or expired - clear cookie to prevent reuse
    deleteCookie(c, "auth_token", { path: "/" });
    throw new AuthError(401, "Invalid or expired session", "/login");
  }
}

/**
 * Require specific role(s) - Check user role against allowed roles
 * @param c - Hono context
 * @param allowedRoles - Array of allowed roles (e.g., ["admin", "teacher"])
 * @returns Promise<JwtPayload> - Decoded user data (if authorized)
 * @throws AuthError - If not authenticated (401) or not authorized (403)
 */
export async function requireRole(
  c: Context,
  allowedRoles: UserRole[]
): Promise<JwtPayload> {
  const user = await requireAuth(c);

  if (!allowedRoles.includes(user.role)) {
    throw new AuthError(
      403,
      `Forbidden. Required roles: [${allowedRoles.join(", ")}]. Your role: ${user.role}`,
      "/dashboard?error=forbidden"
    );
  }

  return user;
}

/**
 * Get user's accessible modules based on their role
 * @param role - User role
 * @returns number[] - Array of module IDs user can access
 */
export function getUserModules(role: UserRole): number[] {
  return getAccessibleModules(role);
}

/**
 * Set authentication cookie with JWT token
 * @param c - Hono context
 * @param token - JWT token
 */
export function setAuthCookie(c: Context, token: string): void {
  setCookie(c, "auth_token", token, {
    httpOnly: true,      // MANDATORY: Prevent XSS
    secure: process.env.NODE_ENV === "production", // MANDATORY: HTTPS only in production
    sameSite: "Lax",     // MANDATORY: CSRF protection
    maxAge: 8 * 60 * 60, // MANDATORY: 8 hours (matches JWT expiry)
    path: "/",
  });
}

/**
 * Clear authentication cookie (used for logout)
 * @param c - Hono context
 */
export function clearAuthCookie(c: Context): void {
  deleteCookie(c, "auth_token", { path: "/" });
}

/**
 * Check if user is authenticated (for /auth/status endpoint)
 * @param c - Hono context
 * @returns Promise<boolean> - True if authenticated, false otherwise
 */
export async function isAuthenticated(c: Context): Promise<boolean> {
  try {
    const token = getCookie(c, "auth_token");
    if (!token) return false;
    await verifyJwt(token);
    return true;
  } catch {
    return false;
  }
}