import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, specialistsTable, childrenTable, sessionsTable } from "@workspace/db";

const router: IRouter = Router();

async function buildSpecialistResponse(s: typeof specialistsTable.$inferSelect) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, s.userId));
  const activeChildrenResult = await db.select({ count: count() }).from(childrenTable).where(eq(childrenTable.specialistId, s.id));
  const totalSessionsResult = await db.select({ count: count() }).from(sessionsTable).where(eq(sessionsTable.specialistId, s.id));
  return {
    id: s.id,
    userId: s.userId,
    name: user?.name ?? "Unknown",
    email: user?.email ?? "",
    specialty: s.specialty,
    bio: s.bio ?? null,
    experience: s.experience ?? null,
    rating: s.rating ?? null,
    totalSessions: totalSessionsResult[0]?.count ?? 0,
    activeChildren: activeChildrenResult[0]?.count ?? 0,
    createdAt: s.createdAt.toISOString(),
  };
}

router.get("/specialists", async (_req, res): Promise<void> => {
  const specialists = await db.select().from(specialistsTable).orderBy(specialistsTable.createdAt);
  const result = await Promise.all(specialists.map(buildSpecialistResponse));
  res.json(result);
});

router.post("/specialists", async (req, res): Promise<void> => {
  const { userId, specialty, bio, experience } = req.body;
  if (!userId || !specialty) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [s] = await db.insert(specialistsTable).values({ userId, specialty, bio: bio ?? null, experience: experience ?? null }).returning();
  res.status(201).json(await buildSpecialistResponse(s));
});

router.get("/specialists/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [s] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, id));
  if (!s) {
    res.status(404).json({ error: "Specialist not found" });
    return;
  }
  res.json(await buildSpecialistResponse(s));
});

router.patch("/specialists/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { specialty, bio, experience } = req.body;

  const [s] = await db.update(specialistsTable).set({
    ...(specialty != null && { specialty }),
    ...(bio != null && { bio }),
    ...(experience != null && { experience }),
  }).where(eq(specialistsTable.id, id)).returning();

  if (!s) {
    res.status(404).json({ error: "Specialist not found" });
    return;
  }
  res.json(await buildSpecialistResponse(s));
});

export default router;
