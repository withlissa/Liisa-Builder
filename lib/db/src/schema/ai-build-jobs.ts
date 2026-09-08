import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiBuildJobs = pgTable("ai_build_jobs", {
  id: text("id").primaryKey(),
  pollToken: text("poll_token").notNull(),
  status: text("status").notNull().default("queued"),
  stage: text("stage").notNull(),
  request: jsonb("request").notNull(),
  result: jsonb("result"),
  error: text("error"),
  identityKey: text("identity_key"),
  usageSource: text("usage_source"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  workerId: text("worker_id"),
  leaseToken: text("lease_token"),
  leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
  runtimeRevision: integer("runtime_revision").notNull().default(0),
  runtimeState: text("runtime_state").notNull().default("idle"),
  runtimeReport: jsonb("runtime_report"),
  runtimeRequestedAt: timestamp("runtime_requested_at", { withTimezone: true }),
  runtimeReportedAt: timestamp("runtime_reported_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelReason: text("cancel_reason"),
});

export const insertAiBuildJobSchema = createInsertSchema(aiBuildJobs).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertAiBuildJob = z.infer<typeof insertAiBuildJobSchema>;
export type AiBuildJob = typeof aiBuildJobs.$inferSelect;