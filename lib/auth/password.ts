/**
 * AUTH MODULE - Password Utilities
 * Owner: Jai (Blue Team Lead)
 * DO NOT MODIFY BY OTHER TEAMS
 *
 * Uses bcryptjs with 12 salt rounds (NON-NEGOTIABLE as per SECURITY.md)
 */

import bcrypt from "bcryptjs";

// Salt rounds: 12 (MANDATORY - from SECURITY.md)
const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 * @param plain - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(plain: string): Promise<string> {
  return await bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Verify a plain text password against a hash
 * @param plain - Plain text password to verify
 * @param hash - Stored hash to compare against
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plain, hash);
}

/**
 * Check if password meets minimum requirements
 * @param password - Password to validate
 * @returns boolean - True if password is valid (min 8 chars)
 */
export function isPasswordValid(password: string): boolean {
  return password.length >= 8;
}