import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, achievementsTable, childAchievementsTable, childrenTable, progressTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/achievements", async (_req, res): Promise<void> => {
  const rows = await db.select().from(achievementsTable).orderBy(achievementsTable.points);
  res.json(rows.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })));
});

router.get("/achievements/child/:childId", async (req, res): Promise<void> => {
  const childId = parseInt(req.params.childId, 10);
  const allAchievements = await db.select().from(achievementsTable);
  const earnedRows = await db
    .select()
    .from(childAchievementsTable)
    .where(eq(childAchievementsTable.childId, childId))
    .orderBy(desc(childAchievementsTable.earnedAt));

  const earnedIds = new Set(earnedRows.map(e => e.achievementId));

  res.json({
    earned: earnedRows.map(e => {
      const ach = allAchievements.find(a => a.id === e.achievementId);
      return { ...ach, earnedAt: e.earnedAt.toISOString() };
    }),
    available: allAchievements.filter(a => !earnedIds.has(a.id)).map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    totalEarned: earnedRows.length,
    totalAvailable: allAchievements.length,
    totalPoints: earnedRows.reduce((sum, e) => {
      const ach = allAchievements.find(a => a.id === e.achievementId);
      return sum + (ach?.points ?? 0);
    }, 0),
  });
});

router.post("/achievements/child/:childId/award/:code", async (req, res): Promise<void> => {
  const childId = parseInt(req.params.childId, 10);
  const code = req.params.code;
  const [ach] = await db.select().from(achievementsTable).where(eq(achievementsTable.code, code));
  if (!ach) {
    res.status(404).json({ error: "Achievement not found" });
    return;
  }
  const existing = await db.select().from(childAchievementsTable).where(and(eq(childAchievementsTable.childId, childId), eq(childAchievementsTable.achievementId, ach.id)));
  if (existing.length > 0) {
    res.json({ alreadyEarned: true, achievement: ach });
    return;
  }
  const [created] = await db.insert(childAchievementsTable).values({ childId, achievementId: ach.id }).returning();
  res.json({ alreadyEarned: false, achievement: ach, earnedAt: created.earnedAt.toISOString() });
});

router.post("/achievements/check/:childId", async (req, res): Promise<void> => {
  const childId = parseInt(req.params.childId, 10);
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, childId));
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  const allProgress = await db.select().from(progressTable).where(eq(progressTable.childId, childId));
  const completedCount = allProgress.filter(p => p.completed).length;
  const allAchievements = await db.select().from(achievementsTable);
  const earned = await db.select().from(childAchievementsTable).where(eq(childAchievementsTable.childId, childId));
  const earnedIds = new Set(earned.map(e => e.achievementId));

  const newlyEarned: typeof allAchievements = [];
  for (const ach of allAchievements) {
    if (earnedIds.has(ach.id)) continue;
    let qualifies = false;
    if (ach.category === "sessions" && child.totalSessions >= ach.threshold) qualifies = true;
    if (ach.category === "exercises" && completedCount >= ach.threshold) qualifies = true;
    if (ach.category === "score" && allProgress.some(p => p.score >= ach.threshold)) qualifies = true;
    if (qualifies) {
      await db.insert(childAchievementsTable).values({ childId, achievementId: ach.id });
      newlyEarned.push(ach);
    }
  }
  res.json({ newlyEarned });
});

export default router;
