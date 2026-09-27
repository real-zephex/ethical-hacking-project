# 🔐 Authentication Module Documentation

**Owner:** Jai (Blue Team Lead)  
**Project:** AI-Enabled Zero-Trust Secure University ERP  
**Status:** ✅ Production Ready  
**Last Updated:** 2026-09-03

---

## 📌 Overview

This module provides **centralized authentication and authorization** for the University ERP system.

⚠️ **IMPORTANT:** All other teams **MUST** use this module for authentication. **DO NOT** implement your own auth system.

---

## 🎯 Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| JWT Authentication | jose library, HS256 | ✅ |
| HTTP-only Cookies | Secure, SameSite=Lax | ✅ |
| Role-Based Access Control | 3 roles (admin, teacher, student) | ✅ |
| Password Hashing | bcryptjs, 12 rounds | ✅ |
| Account Lockout | After 5 failed attempts (15 min) | ✅ |
| Audit Logging | All auth events logged | ✅ |
| Form Validation | Zod + react-hook-form | ✅ |
| Typography | Space Grotesk (headings), IBM Plex Sans (body) | ✅ |

---

## 👥 User Roles

There are **exactly 3 roles** in the system. **DO NOT** create new roles.

| Role | Description | Accessible Modules |
|------|-------------|-------------------|
| `admin` | University Administrator / HOD | All 12 modules |
| `teacher` | Faculty / Instructor | 2, 3, 5, 6, 7, 10, 11, 12 |
| `student` | Enrolled Student | 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12 |

**Module Key:**
1. Admissions, 2. Academic, 3. Examination, 4. Finance, 5. HR & Staff, 6. Student Mgmt, 7. Library, 8. Hostel, 9. Transport, 10. Placement, 11. Research, 12. Communication

---

## 🔧 Quick Start for Other Teams

### 1. Import the Auth Guard

In your API route files, import the auth utilities:

```typescript
import { requireRole, requireAuth } from "@/lib/auth/guard";
```

### 2. Use in API Routes

Every protected route **MUST** start with a role check:

```typescript
import { Hono } from "hono";
import { requireRole } from "@/lib/auth/guard";
import { z } from "zod";

const app = new Hono().basePath("/api");

// Example: Only admin and teacher can access this
app.post("/your-module/action", async (c) => {
  // 1. Require authentication and specific roles
  const user = await requireRole(c, ["admin", "teacher"]);

  // 2. Validate input (MANDATORY)
  const bodySchema = z.object({ /* your schema */ });
  const raw = await c.req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // 3. For student data, check ownership
  if (user.role === "student" && parsed.data.studentId !== user.userId) {
    return c.json({ error: "Forbidden" }, 403);
  }

  // 4. Database operations
  // ... your logic here

  // 5. Return response
  return c.json({ success: true });
});
```

### 3. Use in Frontend Pages

Use the `useAuth` hook for client-side authentication:

```tsx
"use client";
import { useAuth } from "@/lib/auth/useAuth";

export default function YourProtectedPage() {
  // Only allow admin and teacher
  const { user, loading, error } = useAuth(["admin", "teacher"]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Hello, {user.email}!</div>;
}
```

For pages that just need any authenticated user:

```tsx
"use client";
import { useAuth } from "@/lib/auth/useAuth";

export default function YourPage() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return null; // Will redirect to login

  return <div>Welcome, {user.firstName}!</div>;
}
```

---

## 🔐 API Endpoints

All auth endpoints are under `/api/auth/*`.

| Method | Endpoint | Description | Auth Required | Returns |
|--------|----------|-------------|---------------|---------|
| POST | `/api/auth/register` | Register new user | ❌ | User data + JWT cookie |
| POST | `/api/auth/login` | Login user | ❌ | User data + JWT cookie |
| POST | `/api/auth/logout` | Logout user | ✅ | Success message |
| GET | `/api/auth/me` | Get current user | ✅ | User data + modules |
| GET | `/api/auth/status` | Check auth status | ❌ | `{ authenticated: boolean }` |
| GET | `/api/auth/check-email` | Check if email exists | ❌ | `{ exists: boolean }` |

### Request Examples

**Login:**
```javascript
fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "student@university.edu", password: "student123" }),
  credentials: "include", // MANDATORY for cookies
});
```

**Get Current User:**
```javascript
fetch("/api/auth/me", {
  credentials: "include", // MANDATORY for cookies
});
```

---

## 📦 User Object

When authenticated, the user object contains:

```typescript
{
  userId: string;      // UUID v4
  email: string;       // User's email
  role: UserRole;      // "admin" | "teacher" | "student"
  firstName: string;   // User's first name
  lastName: string;    // User's last name
  modules: number[];   // Array of accessible module IDs
  jti: string;         // JWT ID (internal use)
}
```

---

## 🛡️ Security Rules (MANDATORY)

Follow these rules **EXACTLY** or your PR will be rejected:

1. **NEVER** trust client-side role claims
   - Always use `requireRole()` on the server
   - Never use `localStorage` or client-side state for auth decisions

2. **NEVER** store plaintext passwords
   - Always use `hashPassword()` from `@/lib/auth/password`
   - Never implement your own hashing

3. **NEVER** expose database errors to clients
   - Always return generic error messages
   - Example: "Invalid credentials" instead of "User not found"

4. **ALWAYS** validate inputs with Zod
   - Use `z.object()` for request bodies
   - Use `zValidator` for Hono routes
   - Validate on both client and server

5. **ALWAYS** use `requireAuth()` or `requireRole()` before DB operations
   - Every database query must be gated
   - No exceptions

6. **ALWAYS** check data ownership for student-specific operations
   - If role is "student", verify `user.userId === data.studentId`
   - Prevent students from accessing other students' data

7. **ALWAYS** use `credentials: "include"` in fetch requests
   - Required for cookies to be sent
   - Without this, auth will fail

8. **ALWAYS** use the correct fonts
   - Headings: `font-heading` (Space Grotesk)
   - Body: `font-body` (IBM Plex Sans)

---

## 📋 Module Access Matrix

| Module | admin | teacher | student |
|--------|-------|---------|---------|
| 1. Admissions | ✅ Full | ❌ | ✅ Apply/View |
| 2. Academic | ✅ Full | ✅ Manage | ✅ View Own |
| 3. Examination | ✅ Full | ✅ Enter Marks | ✅ Hall Ticket + Results |
| 4. Finance | ✅ Full | ❌ | ✅ Pay/View Own |
| 5. HR & Staff | ✅ Full | ✅ Own Profile | ❌ |
| 6. Student Mgmt | ✅ Full | ✅ View Students | ✅ Own Profile |
| 7. Library | ✅ Full | ✅ | ✅ |
| 8. Hostel | ✅ Full | ❌ | ✅ Own Room/Complaints |
| 9. Transport | ✅ Full | ❌ | ✅ Own Route/Fee |
| 10. Placement | ✅ Full | ✅ View Drives | ✅ Apply/View |
| 11. Research | ✅ Full | ✅ Manage Own | ✅ View/Apply |
| 12. Communication | ✅ Full | ✅ Post to Classes | ✅ View/Discuss |

---

## 🚨 Common Errors & Solutions

| Error | HTTP Status | Cause | Solution |
|-------|-------------|-------|----------|
| `Not authenticated` | 401 | No valid session | Redirect to `/login` |
| `Forbidden` | 403 | User lacks required role | Show "Access Denied" |
| `Invalid email or password` | 401 | Wrong credentials | Show generic error |
| `Account locked` | 403 | Too many failed attempts | Wait 15 minutes |
| `Validation failed` | 400 | Invalid input | Show validation errors |
| `User already exists` | 400 | Email taken | Show error, prompt to login |

---

## 📝 Integration Checklist for Teams

Before submitting your module, ensure:

- [ ] All API routes use `requireRole()` or `requireAuth()`
- [ ] All forms use `react-hook-form` + `zodResolver`
- [ ] All inputs are validated with Zod
- [ ] Student data access checks ownership
- [ ] Correct fonts are used (Space Grotesk for headings, IBM Plex Sans for body)
- [ ] No plaintext passwords
- [ ] No hardcoded secrets
- [ ] No global `db` exports
- [ ] No unauthenticated database queries
- [ ] Error messages are generic

---

## 💬 Support & Contact

For questions or issues with the auth module:

1. **Check this documentation** - Most answers are here
2. **Check the Blue Team Final Implementation Document** - For project-wide rules
3. **Contact Jai** (Blue Team Lead) - For auth-specific questions
4. **Open a GitHub Issue** - For bugs or feature requests

---

## 📚 Additional Resources

- [Repository](https://github.com/real-zephex/ethical-hacking-project)
- [Blue Team Final Implementation Document](https://github.com/real-zephex/ethical-hacking-project/blob/main/Blue%20Team%20-%20Final%20Implementation%20Document.md)
- [SECURITY.md](https://github.com/real-zephex/ethical-hacking-project/blob/main/SECURITY.md)
- [Auth-Api Reference](https://github.com/real-zephex/Auth-Api)

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-09-03 | 1.0.0 | Initial implementation |