/**
 * AUTH MODULE - Reset First Login
 * Run with: node --env-file=.env.local --import=tsx lib/auth/reset-first-login.ts
 */

import { db } from "@/lib/turso";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function resetFirstLogin() {
  console.log("🔄 Resetting firstLogin for all users...");

  try {
    await db
      .update(users)
      .set({
        firstLogin: true,
        lastLoginAt: null,
        updatedAt: new Date().toISOString(),
      });

    console.log("✅ FirstLogin reset successfully!");

    const allUsers = await db.select().from(users).all();
    console.log("\nCurrent users:");
    allUsers.forEach(u => {
      console.log(`- ${u.email} (${u.role}) - firstLogin: ${u.firstLogin}, lastLoginAt: ${u.lastLoginAt}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

resetFirstLogin();