/**
 * CENTRAL API ROUTER
 * All API routes (including auth) are defined here using Hono
 *
 * Auth endpoints owned by: Jai (Blue Team Lead)
 * Other team endpoints will be added below in their respective sections
 */

import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";
import type { Context } from "hono";

// 📦 Import auth utilities
import {
  requireAuth,
  setAuthCookie,
  clearAuthCookie,
  isAuthenticated,
  AuthError,
} from "@/lib/auth/guard";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signJwt, verifyJwt, generateJti } from "@/lib/auth/jwt";
import { type UserRole, getUserModules } from "@/lib/auth/roles";
import { db } from "@/lib/turso";
import { users, auditLogs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

// ======================
// 1. CREATE HONO APP
// ======================
const app = new Hono().basePath("/api");

// Apply middleware
app.use(logger());
app.use("/*", cors({
  origin: "*",
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
}));
app.use("/*", async (c, next) => {
  const cookieHeader = c.req.header("cookie");
  if (cookieHeader) {
    (c as unknown as Record<string, unknown>).cookies = cookieHeader;
  }
  await next();
});

// ======================
// 2. RATE LIMITING (In-Memory)
// ======================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
// Higher limit for development; use Redis in production
const RATE_LIMIT_MAX_REQUESTS = process.env.NODE_ENV === "production" ? 10 : 100;

function getClientIdentifier(c: Context): string {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
             c.req.header("x-real-ip") ||
             c.req.header("cf-connecting-ip") ||
             "unknown";
  return ip;
}

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    // Reset or create new window
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  rateLimitStore.set(identifier, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}

// Rate limiting middleware for auth endpoints
const authRateLimit = async (c: Context, next: () => Promise<void>) => {
  const identifier = getClientIdentifier(c);
  const { allowed, remaining, resetAt } = checkRateLimit(identifier);

  c.header("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
  c.header("X-RateLimit-Remaining", String(remaining));
  c.header("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return c.json(
      { error: "Too many requests. Please try again later." },
      429,
      { "Retry-After": String(retryAfter) }
    );
  }

  await next();
};

// ======================
// 3. HELPER FUNCTIONS
// ======================

/**
 * Write an entry to the audit logs table
 */
async function writeAuditLog(
  userId: string | null,
  role: UserRole | null,
  action: string,
  module: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: randomUUID(),
      userId: userId || null,
      role: role || null,
      action,
      module,
      details: details ? JSON.stringify(details) : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

function getClientIp(c: Context): string {
  return c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
         c.req.header("x-real-ip") ||
         c.req.header("cf-connecting-ip") ||
         "unknown";
}

function getUserAgent(c: Context): string {
  return c.req.header("user-agent") || "unknown";
}

// ======================
// 4. AUTH SCHEMAS (Zod)
// ======================

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "teacher", "student"]),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const checkEmailSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// ======================
// 5. AUTH ENDPOINTS (Jai)
// ======================

// --- POST /api/auth/register ---
app.post("/auth/register", async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const { email, password, firstName, lastName, role } = parsed.data;
  const ipAddress = getClientIp(c);
  const userAgent = getUserAgent(c);

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      await writeAuditLog(null, null, "register_failed", "auth", {
        reason: "user_already_exists",
        email,
      }, ipAddress, userAgent);

      return c.json({ error: "User already exists" }, 400);
    }

    const passwordHash = await hashPassword(password);
    const userId = randomUUID();
    const now = new Date().toISOString();

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      role,
      firstName,
      lastName,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      firstLogin: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const jti = generateJti();
    const token = await signJwt({ userId, email, role, jti });
    setAuthCookie(c, token);

    await writeAuditLog(userId, role, "register_success", "auth", {
      userId, email, role,
    }, ipAddress, userAgent);

    return c.json({
      message: "User registered successfully",
      user: { userId, email, role, firstName, lastName, modules: getUserModules(role) },
    }, 201);
  } catch (error) {
    console.error("Registration error:", error);
    await writeAuditLog(null, null, "register_failed", "auth", {
      error: error instanceof Error ? error.message : "Unknown error",
      email,
    }, ipAddress, userAgent);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// --- POST /api/auth/login ---
app.post("/auth/login", authRateLimit, async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const { email, password } = parsed.data;
  const ipAddress = getClientIp(c);
  const userAgent = getUserAgent(c);

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    // Security: Generic error message - don't reveal if user exists
    if (!user) {
      await writeAuditLog(null, null, "login_failed", "auth", {
        reason: "user_not_found",
        email,
      }, ipAddress, userAgent);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Check if account is locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      await writeAuditLog(user.id, user.role as UserRole, "login_failed", "auth", {
        reason: "account_locked",
        lockedUntil: user.lockedUntil,
      }, ipAddress, userAgent);
      return c.json({
        error: "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes."
      }, 403);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= 5;
      const lockoutUntil = shouldLock ?
        new Date(Date.now() + 15 * 60 * 1000).toISOString() : // 15 minutes lockout
        null;

      await db
        .update(users)
        .set({
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockoutUntil,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, user.id));

      await writeAuditLog(user.id, user.role as UserRole, "login_failed", "auth", {
        reason: "invalid_password",
        failedAttempts,
        lockoutUntil,
      }, ipAddress, userAgent);

      return c.json({ error: "Invalid email or password" }, 401);
    }

    // PASSWORD CORRECT - Now check first-time login logic
    if (user.firstLogin) {
      // First successful login attempt - reject but mark firstLogin as false
      // This prevents automated brute force (bots typically try once)
      // User must retry to prove they're human
      await db
        .update(users)
        .set({
          firstLogin: false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, user.id));

      await writeAuditLog(user.id, user.role as UserRole, "login_first_attempt", "auth", {
        reason: "first_login_rejected",
        message: "First login attempt rejected for security. Please try again.",
      }, ipAddress, userAgent);

      return c.json({
        error: "First login attempt rejected for security. Please try again.",
        firstAttempt: true,
      }, 401);
    }

    // NOT first login - allow access
    // Reset failed attempts on successful login
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    const jti = generateJti();
    const token = await signJwt({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      jti,
    });

    setAuthCookie(c, token);

    await writeAuditLog(user.id, user.role as UserRole, "login_success", "auth", {
      userId: user.id,
      email: user.email,
      role: user.role,
    }, ipAddress, userAgent);

    return c.json({
      message: "Logged in successfully",
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        modules: getUserModules(user.role as UserRole),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    await writeAuditLog(null, null, "login_failed", "auth", {
      error: error instanceof Error ? error.message : "Unknown error",
      email,
    }, ipAddress, userAgent);
    return c.json({ error: "Login failed" }, 500);
  }
});

// --- POST /api/auth/logout ---
app.post("/auth/logout", async (c) => {
  const ipAddress = getClientIp(c);
  const userAgent = getUserAgent(c);

  try {
    let userId: string | null = null;
    let role: UserRole | null = null;

    try {
      const token = c.req.header("cookie")?.split("; ")
        .find((cookie) => cookie.startsWith("auth_token="))?.split("=")[1];

      if (token) {
        const payload = await verifyJwt(token);
        userId = payload.userId;
        role = payload.role;
      }
    } catch {
      // Token invalid/expired - fine for logout
    }

    clearAuthCookie(c);

    await writeAuditLog(userId, role, "logout", "auth", {}, ipAddress, userAgent);

    return c.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({ error: "Logout failed" }, 500);
  }
});

// --- GET /api/auth/me ---
app.get("/auth/me", async (c) => {
  try {
    const user = await requireAuth(c);
    return c.json({
      userId: user.userId,
      email: user.email,
      role: user.role,
      modules: getUserModules(user.role),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return c.json({ error: error.message }, error.status);
    }
    return c.json({ error: "Authentication failed" }, 401);
  }
});

// --- GET /api/auth/status ---
app.get("/auth/status", async (c) => {
  const authenticated = await isAuthenticated(c);
  return c.json({ authenticated });
});

// --- GET /api/auth/check-email ---
app.get("/auth/check-email", async (c) => {
  const query = c.req.query();
  const parsed = checkEmailSchema.safeParse(query);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const { email } = parsed.data;

  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    return c.json({ exists: !!existingUser });
  } catch (error) {
    console.error("Check email error:", error);
    return c.json({ error: "Failed to check email" }, 500);
  }
});

// ======================
// 6. MODULE ENDPOINTS
// ======================
// Other teams will add their endpoints below this line

// ======================
// 7. ERROR HANDLING
// ======================

app.onError((err, c) => {
  console.error("API Error:", err);

  if (err instanceof AuthError) {
    return c.json({
      error: err.message,
      redirectTo: err.redirectTo,
    }, err.status as 401 | 403);
  }

  if (err instanceof z.ZodError) {
    return c.json({
      error: "Validation failed",
      details: err.flatten(),
    }, 400);
  }

  return c.json({ error: "Internal server error" }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// ======================
// 8. EXPORT HANDLERS
// ======================
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);