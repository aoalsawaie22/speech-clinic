import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, sessionsTable, childrenTable, specialistsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

async function buildSessionResponse(s: typeof sessionsTable.$inferSelect) {
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, s.childId));
  const [specialist] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, s.specialistId));
  const [specialistUser] = specialist
    ? await db.select().from(usersTable).where(eq(usersTable.id, specialist.userId))
    : [undefined];

  return {
    id: s.id,
    childId: s.childId,
    childName: child?.name ?? "Unknown",
    specialistId: s.specialistId,
    specialistName: specialistUser?.name ?? "Unknown",
    date: s.date,
    duration: s.duration,
    score: s.score ?? null,
    notes: s.notes ?? null,
    exercisesCompleted: s.exercisesCompleted,
    mood: s.mood ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/sessions", async (req, res): Promise<void> => {
  const { childId, specialistId } = req.query;
  const conditions = [];
  if (childId) conditions.push(eq(sessionsTable.childId, parseInt(childId as string, 10)));
  if (specialistId) conditions.push(eq(sessionsTable.specialistId, parseInt(specialistId as string, 10)));

  const sessions = conditions.length > 0
    ? await db.select().from(sessionsTable).where(and(...conditions)).orderBy(sessionsTable.date)
    : await db.select().from(sessionsTable).orderBy(sessionsTable.date);

  const result = await Promise.all(sessions.map(buildSessionResponse));
  res.json(result);
});

router.post("/sessions", async (req, res): Promise<void> => {
  const { childId, specialistId, date, duration, score, notes, exercisesCompleted, mood } = req.body;
  if (!childId || !specialistId || !date || duration == null || exercisesCompleted == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [session] = await db.insert(sessionsTable).values({
    childId, specialistId, date,
    duration: duration ?? 60,
    score: score ?? null,
    notes: notes ?? null,
    exercisesCompleted: exercisesCompleted ?? 0,
    mood: mood ?? null,
  }).returning();

  await db.update(childrenTable).set({ totalSessions: (await db.select().from(childrenTable).where(eq(childrenTable.id, childId)))[0].totalSessions + 1 }).where(eq(childrenTable.id, childId));

  res.status(201).json(await buildSessionResponse(session));
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(await buildSessionResponse(session));
});

router.patch("/sessions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { score, notes, exercisesCompleted, mood } = req.body;

  const [session] = await db.update(sessionsTable).set({
    ...(score != null && { score }),
    ...(notes != null && { notes }),
    ...(exercisesCompleted != null && { exercisesCompleted }),
    ...(mood != null && { mood }),
  }).where(eq(sessionsTable.id, id)).returning();

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json(await buildSessionResponse(session));
});

export default router;
