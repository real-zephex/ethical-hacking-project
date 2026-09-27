import { db } from "@/lib/turso";
import { users } from "@/lib/schema";

async function reset() {
  await db.update(users).set({ 
    firstLogin: true, 
    lockedUntil: null, 
    failedLoginAttempts: 0,
    lastLoginAt: null
  });
  console.log('✅ Reset complete');
}

reset();