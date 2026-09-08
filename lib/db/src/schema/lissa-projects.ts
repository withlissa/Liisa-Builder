import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const lissaProjects = pgTable("lissa_projects", {
  id: text("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  title: text("title").notNull(),
  files: jsonb("files").$type<Record<string, string>>().notNull(),
  encryptedSecrets: text("encrypted_secrets"),
  publishedPath: text("published_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});