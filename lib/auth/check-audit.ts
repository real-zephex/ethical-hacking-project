/**
 * Check Audit Logs
 * Run with: node --env-file=.env.local --import=tsx lib/auth/check-audit.ts
 */

import { db } from "@/lib/turso";
import { auditLogs } from "@/lib/schema";
import { desc } from "drizzle-orm";

async function checkAudit() {
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(15).all();
  
  console.log("📋 Recent Audit Logs:\n");
  logs.forEach(l => {
    console.log(`[${l.timestamp}] ${l.action} | IP: ${l.ipAddress} | User: ${l.userId || 'anonymous'} | Role: ${l.role || 'none'}`);
    if (l.details) console.log(`  Details: ${l.details}`);
    if (l.userAgent) console.log(`  UA: ${l.userAgent.substring(0, 80)}...`);
    console.log("");
  });
}

checkAudit();