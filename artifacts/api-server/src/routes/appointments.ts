import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, appointmentsTable, childrenTable, specialistsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

async function buildAppointmentResponse(a: typeof appointmentsTable.$inferSelect) {
  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, a.childId));
  const [specialist] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, a.specialistId));
  const [specialistUser] = specialist
    ? await db.select().from(usersTable).where(eq(usersTable.id, specialist.userId))
    : [undefined];

  return {
    id: a.id,
    childId: a.childId,
    childName: child?.name ?? "Unknown",
    specialistId: a.specialistId,
    specialistName: specialistUser?.name ?? "Unknown",
    date: a.date,
    time: a.time,
    duration: a.duration,
    status: a.status,
    notes: a.notes ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/appointments", async (req, res): Promise<void> => {
  const { childId, specialistId, status } = req.query;
  const conditions = [];
  if (childId) conditions.push(eq(appointmentsTable.childId, parseInt(childId as string, 10)));
  if (specialistId) conditions.push(eq(appointmentsTable.specialistId, parseInt(specialistId as string, 10)));
  if (status) conditions.push(eq(appointmentsTable.status, status as string));

  const appointments = conditions.length > 0
    ? await db.select().from(appointmentsTable).where(and(...conditions)).orderBy(appointmentsTable.date)
    : await db.select().from(appointmentsTable).orderBy(appointmentsTable.date);

  const result = await Promise.all(appointments.map(buildAppointmentResponse));
  res.json(result);
});

router.post("/appointments", async (req, res): Promise<void> => {
  const { childId, specialistId, date, time, duration, notes } = req.body;
  if (!childId || !specialistId || !date || !time || duration == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [a] = await db.insert(appointmentsTable).values({
    childId, specialistId, date, time, duration: duration ?? 60, notes: notes ?? null,
  }).returning();
  res.status(201).json(await buildAppointmentResponse(a));
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [a] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, id));
  if (!a) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(await buildAppointmentResponse(a));
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { date, time, duration, status, notes } = req.body;

  const [a] = await db.update(appointmentsTable).set({
    ...(date != null && { date }),
    ...(time != null && { time }),
    ...(duration != null && { duration }),
    ...(status != null && { status }),
    ...(notes != null && { notes }),
  }).where(eq(appointmentsTable.id, id)).returning();

  if (!a) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.json(await buildAppointmentResponse(a));
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [a] = await db.delete(appointmentsTable).where(eq(appointmentsTable.id, id)).returning();
  if (!a) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
