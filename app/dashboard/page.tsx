/**
 * AUTH MODULE - Dashboard Page
 * Owner: Jai (Blue Team Lead)
 * DO NOT MODIFY BY OTHER TEAMS
 *
 * Shows modules based on user's role
 * Uses useAuth hook for client-side auth
 * Fonts: Space Grotesk (headings), IBM Plex Sans (body)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, ShieldCheck, User, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import type { UserRole } from "@/lib/auth/roles";
import { MODULE_METADATA, getUserModules } from "@/lib/auth/roles";
import type { ReactElement } from "react";

// Role-specific welcome messages
const ROLE_WELCOME: Record<UserRole, string> = {
  admin: "Welcome, Administrator!",
  teacher: "Welcome, Faculty!",
  student: "Welcome, Student!",
};

// Role icons
const ROLE_ICONS: Record<UserRole, ReactElement> = {
  admin: <ShieldCheck className="h-8 w-8 text-blue-600" />,
  teacher: <User className="h-8 w-8 text-green-600" />,
  student: <GraduationCap className="h-8 w-8 text-purple-600" />,
};

// Module descriptions by role
const MODULE_DESCRIPTIONS: Record<number, Record<UserRole, string>> = {
  1: {
    admin: "Manage student admissions and applications",
    teacher: "Not available for teachers",
    student: "Submit admission applications and view status",
  },
  2: {
    admin: "Full access to academic records and management",
    teacher: "Manage your classes, syllabus, attendance, and marks",
    student: "View your courses, attendance, and academic progress",
  },
  3: {
    admin: "Full access to examination system and results",
    teacher: "Enter marks, manage exams, and view student performance",
    student: "View your exam schedule, hall tickets, and results",
  },
  4: {
    admin: "Full access to finance system and reports",
    teacher: "Not available for teachers",
    student: "View and pay your fees, scholarships, and dues",
  },
  5: {
    admin: "Full access to HR and staff management",
    teacher: "View your profile, apply for leave, and see payroll",
    student: "Not available for students",
  },
  6: {
    admin: "Full access to student management system",
    teacher: "View student profiles in your classes",
    student: "View and update your profile, documents, and achievements",
  },
  7: {
    admin: "Full access to library management",
    teacher: "Search, issue, and return books; manage catalog",
    student: "Search, borrow, and return books; view fines",
  },
  8: {
    admin: "Full access to hostel management",
    teacher: "Not available for teachers",
    student: "Manage your hostel room, pay fees, and raise complaints",
  },
  9: {
    admin: "Full access to transport management",
    teacher: "Not available for teachers",
    student: "View your transport route, pay fees, and track buses",
  },
  10: {
    admin: "Full access to placement system",
    teacher: "View placement drives and company details",
    student: "Apply for placements, view drives, and track applications",
  },
  11: {
    admin: "Full access to research management",
    teacher: "Manage your research projects, publications, and grants",
    student: "View research opportunities and apply for projects",
  },
  12: {
    admin: "Full access to communication system",
    teacher: "Post announcements to your classes and departments",
    student: "View announcements and participate in forums",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, error, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600 font-body">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Forbidden error (wrong role)
  if (error === "forbidden") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500 font-heading text-center">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 font-body mb-4">
              You do not have permission to access this page.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="font-body"
            >
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Should have redirected to login if not authenticated
  if (!user) {
    return null;
  }

  // Get accessible modules
  const modules = getUserModules(user.role);
  const role = user.role;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          {ROLE_ICONS[role]}
          <div>
            <h1 className="text-2xl font-bold font-heading">
              {ROLE_WELCOME[role]}
            </h1>
            <p className="text-gray-600">
              {user.firstName} {user.lastName} &bull; {user.email}
            </p>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="outline"
          disabled={isLoggingOut}
          className="font-body flex items-center gap-2"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Logout
            </>
          )}
        </Button>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((moduleId: number) => {
          const moduleInfo = MODULE_METADATA[moduleId];
          return (
            <Card
              key={moduleId}
              className="hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
              onClick={() => router.push(moduleInfo.path)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                  <span className="text-2xl">{moduleInfo.icon}</span>
                  <span>{moduleInfo.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 font-body">
                  {MODULE_DESCRIPTIONS[moduleId]?.[role] || "Access module"}
                </p>
                <p className="text-xs text-gray-400 mt-2 font-body">
                  Module #{moduleId}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No modules message (shouldn't happen with our role definitions) */}
      {modules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 font-body">No modules available for your role.</p>
        </div>
      )}
    </div>
  );
}