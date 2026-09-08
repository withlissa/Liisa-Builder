import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const lissaBuildJobs = pgTable("lissa_build_jobs", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address"),
  request: jsonb("request").notNull(),
  status: text("status").notNull().default("queued"),
  stage: text("stage").notNull().default("Planning the product architecture"),
  result: jsonb("result"),
  error: text("error"),
  usageSource: text("usage_source"),
  refunded: boolean("refunded").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});