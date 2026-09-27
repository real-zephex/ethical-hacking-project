/**
 * AUTH MODULE - Demo Account Seeder
 * Owner: Jai (Blue Team Lead)
 * DO NOT MODIFY BY OTHER TEAMS
 *
 * Run with: bun run lib/auth/seed.ts
 * Or add to package.json scripts: "auth:seed": "bun run lib/auth/seed.ts"
 */

import { db } from "@/lib/turso";
import { users } from "@/lib/schema";
import { hashPassword } from "./password";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

interface DemoUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "teacher" | "student";
}

/**
 * Demo users to seed
 * These credentials will be used for testing
 */
const DEMO_USERS: DemoUser[] = [
  {
    email: "admin@university.edu",
    password: "admin123",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
  },
  {
    email: "teacher@university.edu",
    password: "teacher123",
    firstName: "Professor",
    lastName: "Smith",
    role: "teacher",
  },
  {
    email: "student@university.edu",
    password: "student123",
    firstName: "John",
    lastName: "Doe",
    role: "student",
  },
];

/**
 * Seed demo users into the database
 * Will skip users that already exist
 */
async function seedDemoUsers() {
  console.log("🌱 Seeding demo users...");

  for (const demoUser of DEMO_USERS) {
    try {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, demoUser.email))
        .get();

      if (existingUser) {
        console.log(`✅ User already exists: ${demoUser.email} (${demoUser.role})`);
        continue;
      }

      // Hash password
      const passwordHash = await hashPassword(demoUser.password);

      // Insert user
      const now = new Date().toISOString();
      await db.insert(users).values({
        id: randomUUID(),
        email: demoUser.email,
        passwordHash,
        role: demoUser.role,
        firstName: demoUser.firstName,
        lastName: demoUser.lastName,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        firstLogin: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`✅ Created user: ${demoUser.email} (${demoUser.role})`);
    } catch (error) {
      console.error(`❌ Error creating user ${demoUser.email}:`, error);
    }
  }

  console.log("🎉 Demo users seeded successfully!");
  console.log("\nDemo Credentials:");
  DEMO_USERS.forEach((user) => {
    console.log(`- ${user.role.padEnd(10)}: ${user.email} / ${user.password}`);
  });
}

// Run the seeder
seedDemoUsers().catch(console.error);