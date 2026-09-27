import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ========== AUTH MODULE (Team: Jai - Blue Team Lead) ==========

/**
 * Users table - Stores all authenticated users
 * Fields:
 * - id: UUID v4 (primary key)
 * - email: Unique email address
 * - passwordHash: Bcrypt hash of password (12 rounds)
 * - role: "admin" | "teacher" | "student"
 * - firstName/lastName: User's name
 * - isActive: Account status
 * - failedLoginAttempts: Counter for lockout
 * - lockedUntil: ISO timestamp when lockout expires (null if not locked)
 * - firstLogin: Boolean - true if user has never logged in successfully
 * - lastLoginAt: ISO timestamp of last successful login
 * - createdAt/updatedAt: Timestamps
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(), // "admin" | "teacher" | "student"
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  firstLogin: integer("first_login", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: text("last_login_at"),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
  updatedAt: text("updated_at").notNull().default(new Date().toISOString()),
});

/**
 * Audit Logs table - Tracks all authentication and authorization events
 * Fields:
 * - id: UUID v4 (primary key)
 * - userId: Reference to users.id (null if not authenticated)
 * - role: User's role at time of action (null if not authenticated)
 * - action: Type of action (login_success, login_failed, logout, etc.)
 * - module: Which module was accessed (e.g., "auth", "admissions")
 * - details: JSON string with additional context
 * - ipAddress: Client IP address
 * - userAgent: Browser/device info
 * - timestamp: ISO timestamp
 */
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  role: text("role"),
  action: text("action").notNull(),
  module: text("module"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: text("timestamp").notNull().default(new Date().toISOString()),
});