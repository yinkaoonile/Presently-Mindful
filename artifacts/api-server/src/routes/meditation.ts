import { Router, type IRouter } from "express";
import { db, meditationSessionsTable } from "@workspace/db";
import { eq, desc, sum, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/meditation", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";

  const sessions = await db
    .select()
    .from(meditationSessionsTable)
    .where(eq(meditationSessionsTable.sessionId, sessionId))
    .orderBy(desc(meditationSessionsTable.createdAt));

  const mapped = sessions.map((s) => ({
    id: s.id,
    durationType: s.durationType,
    durationSeconds: s.durationSeconds,
    meditationType: s.meditationType,
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
  }));

  res.json(mapped);
});

router.post("/meditation", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";
  const { durationType, durationSeconds, meditationType, notes } = req.body;

  const [session] = await db.insert(meditationSessionsTable).values({
    sessionId,
    durationType,
    durationSeconds,
    meditationType,
    notes: notes || null,
  }).returning();

  res.status(201).json({
    id: session.id,
    durationType: session.durationType,
    durationSeconds: session.durationSeconds,
    meditationType: session.meditationType,
    notes: session.notes,
    createdAt: session.createdAt.toISOString(),
  });
});

router.get("/meditation/streak", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";

  const sessions = await db
    .select()
    .from(meditationSessionsTable)
    .where(eq(meditationSessionsTable.sessionId, sessionId))
    .orderBy(desc(meditationSessionsTable.createdAt));

  const totalSessions = sessions.length;
  const totalMinutes = Math.floor(
    sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionDates = new Set(
    sessions.map((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let currentStreak = 0;
  const checkDate = new Date(today);
  while (sessionDates.has(checkDate.getTime())) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let longestStreak = 0;
  let tempStreak = 0;
  const allDates = Array.from(sessionDates).sort((a, b) => a - b);
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const diff = allDates[i] - allDates[i - 1];
      if (diff === 86400000) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayKey = day.getTime();

    const daySessions = sessions.filter((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === dayKey;
    });

    weeklyActivity.push({
      date: day.toISOString().split("T")[0],
      didMeditate: daySessions.length > 0,
      dayLabel: dayLabels[day.getDay()],
      totalMinutes: Math.floor(daySessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60),
    });
  }

  res.json({ currentStreak, longestStreak, totalSessions, totalMinutes, weeklyActivity });
});

export default router;
