import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const meditationSessionsTable = pgTable("meditation_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  durationType: text("duration_type").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  meditationType: text("meditation_type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMeditationSessionSchema = createInsertSchema(meditationSessionsTable).omit({ id: true, createdAt: true });
export type InsertMeditationSession = z.infer<typeof insertMeditationSessionSchema>;
export type MeditationSession = typeof meditationSessionsTable.$inferSelect;
