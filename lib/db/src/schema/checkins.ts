import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const checkinsTable = pgTable("checkins", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  mood: integer("mood").notNull(),
  journal: text("journal"),
  aiReflection: text("ai_reflection"),
  quoteText: text("quote_text"),
  sharedToCommunity: boolean("shared_to_community").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCheckinSchema = createInsertSchema(checkinsTable).omit({ id: true, createdAt: true });
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type Checkin = typeof checkinsTable.$inferSelect;
