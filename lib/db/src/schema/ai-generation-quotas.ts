import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const aiGenerationQuotas = pgTable("ai_generation_quotas", {
  clientKey: text("client_key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true })
    .notNull()
    .defaultNow(),
  requestCount: integer("request_count").notNull().default(0),
});