import { Router, type IRouter } from "express";
import { db, checkinsTable, communityPostsTable } from "@workspace/db";
import { CreateCheckinBody } from "@workspace/api-zod";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const MOOD_LABELS: Record<number, string> = {
  1: "really low",
  2: "a bit down",
  3: "okay",
  4: "pretty good",
  5: "great",
};

const MOOD_EMOJIS: Record<number, string> = {
  1: "😔",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
};

async function generateAIReflection(mood: number, journal: string | null | undefined): Promise<{ reflection: string; quote: string }> {
  const moodLabel = MOOD_LABELS[mood] || "okay";
  const journalPart = journal ? `\n\nThey also wrote: "${journal}"` : "";
  
  const prompt = `You are a warm, empathetic mental health companion for millennials. The user is feeling ${moodLabel} today (${mood}/5).${journalPart}

Respond with a JSON object with exactly two fields:
- "reflection": A warm, empathetic 2-3 sentence personalized reflection. Be genuine, not generic. Start with their emotional state, validate it, and offer a small uplifting perspective. Never be preachy or clinical.
- "quote": A short, beautiful 1-sentence quote card (under 10 words) that captures being present and authentic. Like "Present, not perfect." or "Today is enough."

Return only valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    return {
      reflection: parsed.reflection || "You showed up today. That matters more than you know.",
      quote: parsed.quote || "Present, not perfect.",
    };
  } catch {
    return {
      reflection: "You showed up today. That matters more than you know. Whatever you're feeling is valid, and being here — checking in with yourself — is a beautiful act of self-care.",
      quote: "Present, not perfect.",
    };
  }
}

router.get("/checkins", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";
  
  const checkins = await db
    .select()
    .from(checkinsTable)
    .where(eq(checkinsTable.sessionId, sessionId))
    .orderBy(desc(checkinsTable.createdAt));
  
  const mapped = checkins.map((c) => ({
    id: c.id,
    mood: c.mood,
    journal: c.journal,
    aiReflection: c.aiReflection,
    quoteText: c.quoteText,
    sharedToCommunity: c.sharedToCommunity,
    createdAt: c.createdAt.toISOString(),
  }));
  
  res.json(mapped);
});

router.post("/checkins", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";
  const body = CreateCheckinBody.parse(req.body);
  
  const { reflection, quote } = await generateAIReflection(body.mood, body.journal);
  
  const [checkin] = await db.insert(checkinsTable).values({
    sessionId,
    mood: body.mood,
    journal: body.journal || null,
    aiReflection: reflection,
    quoteText: quote,
    sharedToCommunity: body.shareAnonymously ?? false,
  }).returning();
  
  if (body.shareAnonymously && checkin) {
    const snippet = body.journal 
      ? body.journal.substring(0, 120) + (body.journal.length > 120 ? "..." : "")
      : `Feeling ${MOOD_LABELS[body.mood] || "okay"} today.`;
    
    await db.insert(communityPostsTable).values({
      checkinId: checkin.id,
      snippet,
      mood: body.mood,
      aiReflection: reflection,
      quoteText: quote,
    });
  }
  
  res.status(201).json({
    checkin: {
      id: checkin.id,
      mood: checkin.mood,
      journal: checkin.journal,
      aiReflection: checkin.aiReflection,
      quoteText: checkin.quoteText,
      sharedToCommunity: checkin.sharedToCommunity,
      createdAt: checkin.createdAt.toISOString(),
    },
    reflection,
    quoteCard: {
      quote,
      mood: checkin.mood,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    },
  });
});

router.get("/checkins/streak", async (req, res) => {
  const sessionId = req.headers["x-session-id"] as string || "default";
  
  const checkins = await db
    .select()
    .from(checkinsTable)
    .where(eq(checkinsTable.sessionId, sessionId))
    .orderBy(desc(checkinsTable.createdAt));

  const totalCheckins = checkins.length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkinDates = new Set(
    checkins.map((c) => {
      const d = new Date(c.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const checkDate = new Date(today);
  while (checkinDates.has(checkDate.getTime())) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  const allDates = Array.from(checkinDates).sort((a, b) => a - b);
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

  const weeklyMoods = [];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dayKey = day.getTime();
    
    const dayCheckins = checkins.filter((c) => {
      const d = new Date(c.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === dayKey;
    });
    
    const mood = dayCheckins.length > 0 ? dayCheckins[0].mood : null;
    
    weeklyMoods.push({
      date: day.toISOString().split("T")[0],
      mood,
      dayLabel: dayLabels[day.getDay()],
    });
  }
  
  const moodsWithValues = checkins.slice(0, 7).map((c) => c.mood);
  const averageMood = moodsWithValues.length > 0
    ? Math.round((moodsWithValues.reduce((a, b) => a + b, 0) / moodsWithValues.length) * 10) / 10
    : 0;
  
  res.json({ currentStreak, longestStreak, totalCheckins, weeklyMoods, averageMood });
});

router.get("/checkins/:id/quote", async (req, res) => {
  const id = parseInt(req.params.id);
  const sessionId = req.headers["x-session-id"] as string || "default";
  
  const [checkin] = await db
    .select()
    .from(checkinsTable)
    .where(and(eq(checkinsTable.id, id), eq(checkinsTable.sessionId, sessionId)));
  
  if (!checkin) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  
  res.json({
    quote: checkin.quoteText || "Present, not perfect.",
    mood: checkin.mood,
    date: checkin.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  });
});

export default router;
