import { Router, type IRouter } from "express";
import { db, goalsTable } from "@workspace/db";
import { eq, and, desc, ne, sql } from "drizzle-orm";

const router: IRouter = Router();

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

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily Goal",
  weekly: "Weekly Goal",
  monthly: "Monthly Goal",
  stop: "Stopping This",
};

function mapGoal(g: typeof goalsTable.$inferSelect) {
  return {
    id: g.id,
    title: g.title,
    type: g.type,
    isPublic: g.isPublic,
    isCompleted: g.isCompleted,
    completedAt: g.completedAt ? g.completedAt.toISOString() : null,
    cheers: g.cheers,
    createdAt: g.createdAt.toISOString(),
  };
}

// GET /goals — list goals for current user
router.get("/goals", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";

  const goals = await db
    .select()
    .from(goalsTable)
    .where(eq(goalsTable.sessionId, sessionId))
    .orderBy(goalsTable.sortOrder, desc(goalsTable.createdAt));

  res.json(goals.map(mapGoal));
});

// POST /goals — create a goal
router.post("/goals", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";
  const { title, type, isPublic } = req.body;

  if (!title || !type) {
    res.status(400).json({ error: "title and type are required" });
    return;
  }

  const validTypes = ["daily", "weekly", "monthly", "stop"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: "type must be one of: daily, weekly, monthly, stop" });
    return;
  }

  const [goal] = await db.insert(goalsTable).values({
    sessionId,
    title: title.trim(),
    type,
    isPublic: isPublic ?? false,
    isCompleted: false,
    sortOrder: 0,
  }).returning();

  res.status(201).json(mapGoal(goal));
});

// PATCH /goals/:id — update a goal
router.patch("/goals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const sessionId = req.headers["x-session-id"] as string || "default";

  const [existing] = await db
    .select()
    .from(goalsTable)
    .where(and(eq(goalsTable.id, id), eq(goalsTable.sessionId, sessionId)));

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const updates: Partial<typeof goalsTable.$inferInsert> = {};
  const { title, isCompleted, isPublic } = req.body;

  if (title !== undefined && title !== null) updates.title = title.trim();
  if (isPublic !== undefined && isPublic !== null) updates.isPublic = isPublic;
  if (isCompleted !== undefined && isCompleted !== null) {
    updates.isCompleted = isCompleted;
    updates.completedAt = isCompleted ? new Date() : null;
  }
  updates.updatedAt = new Date();

  const [updated] = await db
    .update(goalsTable)
    .set(updates)
    .where(and(eq(goalsTable.id, id), eq(goalsTable.sessionId, sessionId)))
    .returning();

  res.json(mapGoal(updated));
});

// DELETE /goals/:id — delete a goal
router.delete("/goals/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const sessionId = req.headers["x-session-id"] as string || "default";

  const [existing] = await db
    .select()
    .from(goalsTable)
    .where(and(eq(goalsTable.id, id), eq(goalsTable.sessionId, sessionId)));

  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.sessionId, sessionId)));
  res.json({ success: true });
});

// GET /goals/community — public goals from others
router.get("/goals/community", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";

  const goals = await db
    .select()
    .from(goalsTable)
    .where(and(
      eq(goalsTable.isPublic, true),
      ne(goalsTable.sessionId, sessionId),
    ))
    .orderBy(desc(goalsTable.createdAt))
    .limit(50);

  res.json(goals.map((g) => ({
    id: g.id,
    title: g.title,
    type: g.type,
    isCompleted: g.isCompleted,
    cheers: g.cheers,
    timeAgo: timeAgo(g.createdAt),
    typeLabel: TYPE_LABELS[g.type] || g.type,
  })));
});

// POST /goals/community/:id/cheer — cheer a public goal
router.post("/goals/community/:id/cheer", async (req, res) => {
  const id = parseInt(req.params.id);

  const [goal] = await db
    .select()
    .from(goalsTable)
    .where(and(eq(goalsTable.id, id), eq(goalsTable.isPublic, true)));

  if (!goal) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [updated] = await db
    .update(goalsTable)
    .set({ cheers: goal.cheers + 1 })
    .where(eq(goalsTable.id, id))
    .returning();

  res.json({ cheers: updated.cheers });
});

export default router;
