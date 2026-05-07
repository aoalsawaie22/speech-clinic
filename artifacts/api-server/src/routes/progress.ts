import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, progressTable, exercisesTable, childrenTable } from "@workspace/db";

const router: IRouter = Router();

async function buildProgressResponse(p: typeof progressTable.$inferSelect) {
  const [exercise] = await db.select().from(exercisesTable).where(eq(exercisesTable.id, p.exerciseId));

  return {
    id: p.id,
    childId: p.childId,
    exerciseId: p.exerciseId,
    exerciseTitle: exercise?.title ?? "Unknown",
    score: p.score,
    completed: p.completed,
    date: p.date,
    notes: p.notes ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/progress", async (req, res): Promise<void> => {
  const { childId, exerciseId } = req.query;

  const conditions = [];
  if (childId) conditions.push(eq(progressTable.childId, parseInt(childId as string, 10)));
  if (exerciseId) conditions.push(eq(progressTable.exerciseId, parseInt(exerciseId as string, 10)));

  const records = conditions.length > 0
    ? await db.select().from(progressTable).where(and(...conditions)).orderBy(progressTable.date)
    : await db.select().from(progressTable).orderBy(progressTable.date);

  const result = await Promise.all(records.map(buildProgressResponse));
  res.json(result);
});

router.post("/progress", async (req, res): Promise<void> => {
  const { childId, exerciseId, score, completed, date, notes } = req.body;

  if (!childId || !exerciseId || score == null || completed == null || !date) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // 1️⃣ حفظ التقدم
  const [record] = await db.insert(progressTable).values({
    childId,
    exerciseId,
    score,
    completed,
    date,
    notes: notes ?? null,
  }).returning();

  // 2️⃣ جلب الطفل
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, childId));

  if (child && completed) {
    // 3️⃣ تحديث عدد الجلسات
    await db
      .update(childrenTable)
      .set({
        totalSessions: (child.totalSessions ?? 0) + 1,
        progressLevel: (child.progressLevel ?? 0) + score,
      })
      .where(eq(childrenTable.id, childId));
  }

  // 4️⃣ (اختياري بسيط) إذا وصل مستوى معين → يعتبر إنجاز
  // بدون ما نضيف جدول جديد أو نخرب النظام
  // هذا فقط تجهيز للمستقبل
  if (child && child.progressLevel + score >= 20) {
    console.log("🎉 Achievement unlocked (level up ready)");
  }

  res.status(201).json(await buildProgressResponse(record));
});

export default router;