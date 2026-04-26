import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/notifications/:userId", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows.map(n => ({
    id: n.id,
    userId: n.userId,
    title: n.title,
    titleEn: n.titleEn ?? n.title,
    message: n.message,
    messageEn: n.messageEn ?? n.message,
    type: n.type,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  })));
});

router.post("/notifications", async (req, res): Promise<void> => {
  const { userId, title, titleEn, message, messageEn, type, link } = req.body;
  const [created] = await db.insert(notificationsTable).values({
    userId, title, titleEn, message, messageEn, type: type ?? "info", link,
  }).returning();
  res.json(created);
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.id, id));
  res.json({ ok: true });
});

router.patch("/notifications/user/:userId/read-all", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  await db.update(notificationsTable).set({ read: true }).where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
  res.json({ ok: true });
});

router.delete("/notifications/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.json({ ok: true });
});

export default router;
