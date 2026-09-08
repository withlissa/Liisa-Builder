import { bigint, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { aiBuildJobs } from "./ai-build-jobs";

export const aiBuildJobEvents = pgTable("ai_build_job_events", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  jobId: text("job_id").notNull().references(() => aiBuildJobs.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail"),
  metadata: jsonb("metadata"),
  eventKey: text("event_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("ai_build_job_events_job_event_key_unique").on(table.jobId, table.eventKey),
]);

export const insertAiBuildJobEventSchema = createInsertSchema(aiBuildJobEvents).omit({
  createdAt: true,
});
export type InsertAiBuildJobEvent = z.infer<typeof insertAiBuildJobEventSchema>;
export type AiBuildJobEvent = typeof aiBuildJobEvents.$inferSelect;