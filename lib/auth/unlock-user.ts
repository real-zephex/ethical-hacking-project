/**
 * AUTH MODULE - Unlock User
 * Run with: node --env-file=.env.local --import=tsx lib/auth/unlock-user.ts
 */

import { db } from "@/lib/turso";
import { users } from "@/lib/schema";

async function unlockUser() {
  console.log("🔓 Unlocking user accounts...");

  try {
    // Unlock all users
    await db
      .update(users)
      .set({
        lockedUntil: null,
        failedLoginAttempts: 0,
        updatedAt: new Date().toISOString(),
      });

    console.log("✅ Users unlocked successfully!");

    // Verify
    const allUsers = await db.select().from(users).all();
    console.log("\nCurrent users:");
    allUsers.forEach(u => {
      console.log(`- ${u.email} (${u.role}) - lockedUntil: ${u.lockedUntil}, failedAttempts: ${u.failedLoginAttempts}, firstLogin: ${u.firstLogin}`);
    });
  } catch (error) {
    console.error("❌ Error unlocking users:", error);
  }
}

unlockUser();