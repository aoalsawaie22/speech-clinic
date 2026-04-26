import { Router, type IRouter } from "express";
import { eq, sql, and, gte } from "drizzle-orm";
import { db, sessionsTable, progressTable, childrenTable, exercisesTable, appointmentsTable } from "@workspace/db";

const router: IRouter = Router();

// Sessions per day for the last 30 days
router.get("/reports/sessions-trend", async (req, res): Promise<void> => {
  const specialistId = req.query.specialistId ? parseInt(req.query.specialistId as string, 10) : null;
  const childId = req.query.childId ? parseInt(req.query.childId as string, 10) : null;
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  let rows = await db.select().from(sessionsTable).where(gte(sessionsTable.date, since));
  if (specialistId) rows = rows.filter(r => r.specialistId === specialistId);
  if (childId) rows = rows.filter(r => r.childId === childId);

  // Build day buckets
  const buckets = new Map<string, { date: string; sessions: number; avgScore: number; totalScore: number; scoredCount: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    buckets.set(d, { date: d, sessions: 0, avgScore: 0, totalScore: 0, scoredCount: 0 });
  }
  for (const s of rows) {
    const b = buckets.get(s.date);
    if (!b) continue;
    b.sessions += 1;
    if (s.score != null) {
      b.totalScore += s.score;
      b.scoredCount += 1;
    }
  }
  for (const b of buckets.values()) {
    b.avgScore = b.scoredCount > 0 ? Math.round(b.totalScore / b.scoredCount) : 0;
  }
  res.json(Array.from(buckets.values()));
});

// Exercises completion by category
router.get("/reports/categories", async (req, res): Promise<void> => {
  const childId = req.query.childId ? parseInt(req.query.childId as string, 10) : null;
  const exercises = await db.select().from(exercisesTable);
  const exMap = new Map(exercises.map(e => [e.id, e]));

  let progress = await db.select().from(progressTable);
  if (childId) progress = progress.filter(p => p.childId === childId);

  const byCategory = new Map<string, { category: string; completed: number; total: number; avgScore: number }>();
  const cats = ["pronunciation", "vocabulary", "fluency", "listening", "breathing"];
  for (const c of cats) byCategory.set(c, { category: c, completed: 0, total: 0, avgScore: 0 });

  const scoresByCategory = new Map<string, number[]>();
  for (const p of progress) {
    const ex = exMap.get(p.exerciseId);
    if (!ex) continue;
    const b = byCategory.get(ex.category);
    if (!b) continue;
    b.total += 1;
    if (p.completed) b.completed += 1;
    if (!scoresByCategory.has(ex.category)) scoresByCategory.set(ex.category, []);
    scoresByCategory.get(ex.category)!.push(p.score);
  }
  for (const [cat, scores] of scoresByCategory) {
    const b = byCategory.get(cat);
    if (b && scores.length > 0) b.avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
  res.json(Array.from(byCategory.values()));
});

// Appointments status breakdown
router.get("/reports/appointments-status", async (req, res): Promise<void> => {
  const specialistId = req.query.specialistId ? parseInt(req.query.specialistId as string, 10) : null;
  let rows = await db.select().from(appointmentsTable);
  if (specialistId) rows = rows.filter(r => r.specialistId === specialistId);
  const counts = { scheduled: 0, completed: 0, cancelled: 0, no_show: 0 };
  for (const a of rows) counts[a.status] += 1;
  res.json([
    { status: "scheduled", count: counts.scheduled },
    { status: "completed", count: counts.completed },
    { status: "cancelled", count: counts.cancelled },
    { status: "no_show", count: counts.no_show },
  ]);
});

// Top performing children
router.get("/reports/top-children", async (req, res): Promise<void> => {
  const specialistId = req.query.specialistId ? parseInt(req.query.specialistId as string, 10) : null;
  let children = await db.select().from(childrenTable);
  if (specialistId) children = children.filter(c => c.specialistId === specialistId);
  const sorted = children
    .sort((a, b) => b.progressLevel - a.progressLevel)
    .slice(0, 10)
    .map(c => ({ id: c.id, name: c.name, age: c.age, progressLevel: c.progressLevel, totalSessions: c.totalSessions }));
  res.json(sorted);
});

export default router;
