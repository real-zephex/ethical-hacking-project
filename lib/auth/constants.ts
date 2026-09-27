/**
 * AUTH MODULE - Constants
 * Owner: Jai (Blue Team Lead)
 * DO NOT MODIFY BY OTHER TEAMS
 */

// Authentication settings
export const AUTH_CONSTANTS = {
  // Token settings
  JWT_EXPIRY: "8h", // MANDATORY: 8 hours
  JWT_ALGORITHM: "HS256" as const, // MANDATORY: HS256

  // Password settings
  MIN_PASSWORD_LENGTH: 8, // MANDATORY: Minimum 8 characters
  SALT_ROUNDS: 12, // MANDATORY: 12 rounds (from SECURITY.md)

  // Session settings
  COOKIE_NAME: "auth_token",
  COOKIE_MAX_AGE: 8 * 60 * 60, // 8 hours in seconds (matches JWT expiry)

  // Security settings
  MAX_FAILED_ATTEMPTS: 5, // MANDATORY: Lock after 5 failed attempts
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes in ms

  // Rate limiting (for future use)
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 10, // Max requests per window
};

// Module access constants
export const MODULE_COUNT = 12;
export const ALL_MODULES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

// Error messages
export const AUTH_ERRORS = {
  NOT_AUTHENTICATED: "Not authenticated",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  USER_ALREADY_EXISTS: "User already exists",
  PASSWORD_TOO_WEAK: `Password must be at least ${AUTH_CONSTANTS.MIN_PASSWORD_LENGTH} characters`,
  INVALID_EMAIL: "Invalid email format",
  ACCOUNT_LOCKED: "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.",
  TOKEN_EXPIRED: "Session expired. Please log in again.",
  FORBIDDEN: "You do not have permission to access this resource",
  INVALID_TOKEN: "Invalid or expired session",
};