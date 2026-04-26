import { Router, type IRouter } from "express";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/messages/:userId", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  const rows = await db
    .select()
    .from(messagesTable)
    .where(or(eq(messagesTable.fromUserId, userId), eq(messagesTable.toUserId, userId)))
    .orderBy(desc(messagesTable.createdAt));

  // Group conversations by other party
  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  const convos = new Map<number, { otherUserId: number; otherUserName: string; otherUserRole: string; lastMessage: string; lastDate: string; unreadCount: number; messages: any[] }>();
  for (const m of rows) {
    const otherId = m.fromUserId === userId ? m.toUserId : m.fromUserId;
    if (!convos.has(otherId)) {
      const other = userMap.get(otherId);
      convos.set(otherId, {
        otherUserId: otherId,
        otherUserName: other?.name ?? "Unknown",
        otherUserRole: other?.role ?? "user",
        lastMessage: m.content,
        lastDate: m.createdAt.toISOString(),
        unreadCount: 0,
        messages: [],
      });
    }
    const c = convos.get(otherId)!;
    c.messages.push({
      id: m.id,
      fromUserId: m.fromUserId,
      toUserId: m.toUserId,
      content: m.content,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
      isMine: m.fromUserId === userId,
    });
    if (!m.read && m.toUserId === userId) c.unreadCount += 1;
  }
  // Sort messages within each convo chronologically
  for (const c of convos.values()) c.messages.reverse();
  res.json(Array.from(convos.values()));
});

router.post("/messages", async (req, res): Promise<void> => {
  const { fromUserId, toUserId, content } = req.body;
  if (!fromUserId || !toUserId || !content) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const [created] = await db.insert(messagesTable).values({ fromUserId, toUserId, content }).returning();
  res.json({ ...created, createdAt: created.createdAt.toISOString() });
});

router.patch("/messages/conversation/:userId/:otherId/read", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  const otherId = parseInt(req.params.otherId, 10);
  await db.update(messagesTable).set({ read: true })
    .where(and(eq(messagesTable.fromUserId, otherId), eq(messagesTable.toUserId, userId), eq(messagesTable.read, false)));
  res.json({ ok: true });
});

router.get("/messages/unread-count/:userId", async (req, res): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  const rows = await db.select({ c: sql<number>`count(*)::int` }).from(messagesTable)
    .where(and(eq(messagesTable.toUserId, userId), eq(messagesTable.read, false)));
  res.json({ count: rows[0]?.c ?? 0 });
});

export default router;
