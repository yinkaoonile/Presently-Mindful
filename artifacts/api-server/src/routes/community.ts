import { Router, type IRouter } from "express";
import { db, communityPostsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";

const router: IRouter = Router();

const MOOD_EMOJIS: Record<number, string> = {
  1: "😔",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

router.get("/community", async (req, res) => {
  const page = parseInt(req.query.page as string || "1");
  const limit = parseInt(req.query.limit as string || "20");
  const offset = (page - 1) * limit;
  
  const posts = await db
    .select()
    .from(communityPostsTable)
    .orderBy(desc(communityPostsTable.createdAt))
    .limit(limit)
    .offset(offset);
  
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(communityPostsTable);
  
  const mappedPosts = posts.map((p) => ({
    id: p.id,
    snippet: p.snippet,
    mood: p.mood,
    aiReflection: p.aiReflection,
    quoteText: p.quoteText,
    hugs: p.hugs,
    likes: p.likes,
    timeAgo: timeAgo(p.createdAt),
    moodEmoji: MOOD_EMOJIS[p.mood] || "😐",
  }));
  
  res.json({ posts: mappedPosts, total, page });
});

router.post("/community/:id/hug", async (req, res) => {
  const id = parseInt(req.params.id);
  
  const [post] = await db
    .select()
    .from(communityPostsTable)
    .where(eq(communityPostsTable.id, id));
  
  if (!post) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  
  const [updated] = await db
    .update(communityPostsTable)
    .set({ hugs: post.hugs + 1 })
    .where(eq(communityPostsTable.id, id))
    .returning();
  
  res.json({ hugs: updated.hugs });
});

router.post("/community/:id/like", async (req, res) => {
  const id = parseInt(req.params.id);
  
  const [post] = await db
    .select()
    .from(communityPostsTable)
    .where(eq(communityPostsTable.id, id));
  
  if (!post) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  
  const [updated] = await db
    .update(communityPostsTable)
    .set({ likes: post.likes + 1 })
    .where(eq(communityPostsTable.id, id))
    .returning();
  
  res.json({ likes: updated.likes });
});

export default router;
