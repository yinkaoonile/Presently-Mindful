import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const communityPostsTable = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  checkinId: integer("checkin_id").notNull(),
  snippet: text("snippet").notNull(),
  mood: integer("mood").notNull(),
  aiReflection: text("ai_reflection"),
  quoteText: text("quote_text"),
  hugs: integer("hugs").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  checkOns: integer("check_ons").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPostsTable).omit({ id: true, createdAt: true, hugs: true, likes: true });
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPostsTable.$inferSelect;
