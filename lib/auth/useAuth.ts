/**
 * AUTH MODULE - Client-Side Auth Hook
 * Owner: Jai (Blue Team Lead)
 * DO NOT MODIFY BY OTHER TEAMS
 *
 * Used by all frontend pages for client-side authentication
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserRole } from "./roles";
import type { JwtPayload } from "./jwt";

interface AuthUser extends JwtPayload {
  modules: number[]; // Modules user can access
  firstName?: string;
  lastName?: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export function useAuth(allowedRoles?: UserRole[]): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  /**
   * Fetch current user data from /api/auth/me
   */
  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include", // MANDATORY: Send cookies
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - redirect to login (unless already on login page)
          if (pathname !== "/login") {
            router.push("/login");
          }
          setUser(null);
          return;
        }
        throw new Error(`Auth error: ${response.status}`);
      }

      const data = await response.json();

      // Check if user has required role
      if (allowedRoles && data.role && !allowedRoles.includes(data.role)) {
        setError("forbidden");
        router.push("/dashboard?error=forbidden");
        return;
      }

      setUser(data);
    } catch (err) {
      console.error("Auth error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [allowedRoles, pathname, router]);

  /**
   * Login user with email and password
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // MANDATORY: Send cookies
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Login failed");
        return false;
      }

      // Login successful - fetch user data
      await fetchUser();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUser]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setLoading(false);
      router.push("/login");
    }
  }, [router]);

  /**
   * Check authentication status
   */
  const checkAuth = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  /**
   * Initial auth check on component mount
   */
  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
  };
}

/**
 * Hook for protected pages - automatically redirects if not authenticated
 * Use this for pages that require authentication
 */
export function useProtectedAuth(allowedRoles?: UserRole[]) {
  const auth = useAuth(allowedRoles);

  // If loading, show nothing (or loading spinner)
  if (auth.loading) {
    return { ...auth, ready: false };
  }

  // If not authenticated or forbidden, this will have already redirected
  return { ...auth, ready: true };
}