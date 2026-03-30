import { Router, type IRouter } from "express";
import { db, communityPostsTable, communityRepliesTable } from "@workspace/db";
import { eq, desc, sql, inArray } from "drizzle-orm";

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

  const postIds = posts.map((p) => p.id);
  const replyCounts = postIds.length > 0
    ? await db
        .select({ postId: communityRepliesTable.postId, count: sql<number>`count(*)::int` })
        .from(communityRepliesTable)
        .where(inArray(communityRepliesTable.postId, postIds))
        .groupBy(communityRepliesTable.postId)
    : [];

  const replyCountMap = Object.fromEntries(replyCounts.map((r) => [r.postId, r.count]));

  const mappedPosts = posts.map((p) => ({
    id: p.id,
    snippet: p.snippet,
    mood: p.mood,
    aiReflection: p.aiReflection,
    quoteText: p.quoteText,
    hugs: p.hugs,
    likes: p.likes,
    checkOns: p.checkOns ?? 0,
    replyCount: replyCountMap[p.id] ?? 0,
    timeAgo: timeAgo(p.createdAt),
    moodEmoji: MOOD_EMOJIS[p.mood] || "😐",
  }));

  res.json({ posts: mappedPosts, total, page });
});

router.post("/community/:id/hug", async (req, res) => {
  const id = parseInt(req.params.id);
  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, id));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db
    .update(communityPostsTable)
    .set({ hugs: post.hugs + 1 })
    .where(eq(communityPostsTable.id, id))
    .returning();
  res.json({ hugs: updated.hugs });
});

router.post("/community/:id/like", async (req, res) => {
  const id = parseInt(req.params.id);
  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, id));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db
    .update(communityPostsTable)
    .set({ likes: post.likes + 1 })
    .where(eq(communityPostsTable.id, id))
    .returning();
  res.json({ likes: updated.likes });
});

router.post("/community/:id/checkon", async (req, res) => {
  const id = parseInt(req.params.id);
  const [post] = await db.select().from(communityPostsTable).where(eq(communityPostsTable.id, id));
  if (!post) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db
    .update(communityPostsTable)
    .set({ checkOns: (post.checkOns ?? 0) + 1 })
    .where(eq(communityPostsTable.id, id))
    .returning();
  res.json({ checkOns: updated.checkOns ?? 0 });
});

router.get("/community/:id/replies", async (req, res) => {
  const id = parseInt(req.params.id);
  const replies = await db
    .select()
    .from(communityRepliesTable)
    .where(eq(communityRepliesTable.postId, id))
    .orderBy(desc(communityRepliesTable.createdAt));

  res.json(replies.map((r) => ({
    id: r.id,
    postId: r.postId,
    message: r.message,
    timeAgo: timeAgo(r.createdAt),
  })));
});

router.post("/community/:id/replies", async (req, res) => {
  const id = parseInt(req.params.id);
  const sessionId = req.headers["x-session-id"] as string || "default";
  const { message } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const [reply] = await db.insert(communityRepliesTable).values({
    postId: id,
    sessionId,
    message: message.trim(),
  }).returning();

  res.status(201).json({
    id: reply.id,
    postId: reply.postId,
    message: reply.message,
    timeAgo: "just now",
  });
});

export default router;
