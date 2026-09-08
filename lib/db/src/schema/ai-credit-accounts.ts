import { bigint, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const aiCreditAccounts = pgTable("ai_credit_accounts", {
  identityKey: text("identity_key").primaryKey(),
  walletAddress: text("wallet_address").unique(),
  creditMicrousd: bigint("credit_microusd", { mode: "bigint" }).notNull().default(sql`0`),
  lastClaimAt: timestamp("last_claim_at", { withTimezone: true }),
  dailyBuildDate: date("daily_build_date").notNull().defaultNow(),
  dailyBuildCount: integer("daily_build_count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});