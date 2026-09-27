/**
 * AUTH MODULE - JWT Token Utilities
 * Owner: Jai (Blue Team Lead)
 * DO NOT MODIFY BY OTHER TEAMS
 *
 * Uses jose library with HS256 algorithm
 * Tokens stored in HTTP-only cookies
 * Expiry: 8 hours (NON-NEGOTIABLE)
 */

import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "./roles";
import { randomUUID } from "node:crypto";

// Ensure JWT_SECRET is set and valid (min 32 chars)
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long (MANDATORY)");
  }
  return new TextEncoder().encode(secret);
}

/**
 * JWT Payload structure
 * Contains user data that will be stored in the token
 */
export interface JwtPayload {
  userId: string;      // User UUID
  email: string;       // User email
  role: UserRole;      // User role (admin, teacher, student)
  jti: string;         // JWT ID (for potential revocation)
  iat?: number;        // Issued at (timestamp)
  exp?: number;        // Expiration (timestamp)
}

/**
 * Generate a signed JWT token
 * @param payload - User data to include in token
 * @returns Promise<string> - Signed JWT token
 */
export async function signJwt(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  const jti = randomUUID(); // Unique JWT ID

  return await new SignJWT({
    ...payload,
    jti,
  })
    .setProtectedHeader({ alg: "HS256" }) // MANDATORY: HS256 algorithm
    .setIssuedAt()
    .setExpirationTime("8h") // MANDATORY: 8 hours expiry
    .setJti(jti)
    .sign(getJwtSecret());
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Promise<JwtPayload> - Decoded payload
 * @throws Error - If token is invalid or expired
 */
export async function verifyJwt(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as JwtPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Generate a new JWT ID (UUID v4)
 * @returns string - Random UUID
 */
export function generateJti(): string {
  return randomUUID();
}