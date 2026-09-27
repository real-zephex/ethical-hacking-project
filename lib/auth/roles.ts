/**
 * AUTH MODULE - Role Definitions
 * Owner: Jai (Blue Team Lead)
 * DO NOT MODIFY BY OTHER TEAMS
 */

// Define the three allowed roles (NON-NEGOTIABLE)
export const USER_ROLES = ["admin", "teacher", "student"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Modules 1-12 visible in the dashboard grid per role
 * Module IDs:
 * 1: Admissions, 2: Academic, 3: Examination, 4: Finance,
 * 5: HR & Staff, 6: Student Mgmt, 7: Library, 8: Hostel,
 * 9: Transport, 10: Placement, 11: Research, 12: Communication
 */
export const ROLE_MODULE_ACCESS: Record<UserRole, number[]> = {
  admin: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // All modules
  teacher: [2, 3, 5, 6, 7, 10, 11, 12], // Academic, Exam, HR, Student Mgmt, Library, Placement, Research, Communication
  student: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12], // All except HR & Staff
};

/**
 * Get accessible modules for a user role
 * @param role - User role
 * @returns Array of module IDs user can access
 */
export function getAccessibleModules(role: UserRole): number[] {
  return ROLE_MODULE_ACCESS[role];
}

/**
 * Get user's accessible modules based on their role (alias for getAccessibleModules)
 * @param role - User role
 * @returns number[] - Array of module IDs user can access
 */
export function getUserModules(role: UserRole): number[] {
  return getAccessibleModules(role);
}

/**
 * Check if a user role has access to a specific module
 * @param role - User role
 * @param moduleId - Module ID to check
 * @returns boolean - True if user has access
 */
export function hasModuleAccess(role: UserRole, moduleId: number): boolean {
  return ROLE_MODULE_ACCESS[role].includes(moduleId);
}

/**
 * Module metadata for dashboard display
 * Used to render module cards with icons and paths
 */
export const MODULE_METADATA: Record<number, { name: string; icon: string; path: string }> = {
  1: { name: "Admissions", icon: "📝", path: "/admissions" },
  2: { name: "Academic", icon: "📚", path: "/academic" },
  3: { name: "Examination", icon: "📋", path: "/examination" },
  4: { name: "Finance", icon: "💰", path: "/finance" },
  5: { name: "HR & Staff", icon: "👥", path: "/hr-staff" },
  6: { name: "Student Mgmt", icon: "👤", path: "/student-mgmt" },
  7: { name: "Library", icon: "📖", path: "/library" },
  8: { name: "Hostel", icon: "🏠", path: "/hostel" },
  9: { name: "Transport", icon: "🚍", path: "/transport" },
  10: { name: "Placement", icon: "🎯", path: "/placement" },
  11: { name: "Research", icon: "🔬", path: "/research" },
  12: { name: "Communication", icon: "💬", path: "/communication" },
};