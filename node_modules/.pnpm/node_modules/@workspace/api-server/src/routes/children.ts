import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, childrenTable } from "@workspace/db";

const router: IRouter = Router();

function buildChildResponse(c: typeof childrenTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    age: c.age,
    gender: c.gender,
    parentId: c.parentId,
    specialistId: c.specialistId ?? null,
    diagnosis: c.diagnosis ?? null,
    notes: c.notes ?? null,
    progressLevel: c.progressLevel,
    totalSessions: c.totalSessions,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/children", async (req, res): Promise<void> => {
  const { parentId, specialistId } = req.query;
  const conditions = [];
  if (parentId) conditions.push(eq(childrenTable.parentId, parseInt(parentId as string, 10)));
  if (specialistId) conditions.push(eq(childrenTable.specialistId, parseInt(specialistId as string, 10)));

  const children = conditions.length > 0
    ? await db.select().from(childrenTable).where(and(...conditions)).orderBy(childrenTable.createdAt)
    : await db.select().from(childrenTable).orderBy(childrenTable.createdAt);

  res.json(children.map(buildChildResponse));
});

router.post("/children", async (req, res): Promise<void> => {
  const { name, age, gender, parentId, specialistId, diagnosis, notes } = req.body;
  if (!name || age == null || !gender || !parentId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [child] = await db.insert(childrenTable).values({
    name, age, gender, parentId,
    specialistId: specialistId ?? null,
    diagnosis: diagnosis ?? null,
    notes: notes ?? null,
  }).returning();
  res.status(201).json(buildChildResponse(child));
});

router.get("/children/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, id));
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  res.json(buildChildResponse(child));
});

router.patch("/children/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, age, specialistId, diagnosis, notes, progressLevel } = req.body;

  const [child] = await db.update(childrenTable).set({
    ...(name != null && { name }),
    ...(age != null && { age }),
    ...(specialistId !== undefined && { specialistId: specialistId ?? null }),
    ...(diagnosis != null && { diagnosis }),
    ...(notes != null && { notes }),
    ...(progressLevel != null && { progressLevel }),
  }).where(eq(childrenTable.id, id)).returning();

  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  res.json(buildChildResponse(child));
});

router.delete("/children/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [child] = await db.delete(childrenTable).where(eq(childrenTable.id, id)).returning();
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
