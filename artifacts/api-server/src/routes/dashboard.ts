import { Router, type IRouter } from "express";
import { eq, count, avg, and, lte, gte } from "drizzle-orm";
import { db, usersTable, specialistsTable, childrenTable, appointmentsTable, sessionsTable, exercisesTable, progressTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/admin", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [totalChildrenRes] = await db.select({ count: count() }).from(childrenTable);
  const [totalSpecialistsRes] = await db.select({ count: count() }).from(specialistsTable);
  const [totalParentsRes] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "parent"));
  const [totalSessionsRes] = await db.select({ count: count() }).from(sessionsTable);

  const allAppointments = await db.select().from(appointmentsTable).orderBy(appointmentsTable.date);
  const appointmentsToday = allAppointments.filter(a => a.date === today).length;
  const appointmentsThisWeek = allAppointments.filter(a => a.date >= weekStart && a.date <= today).length;

  const allChildren = await db.select().from(childrenTable);
  const averageProgress = allChildren.length > 0
    ? allChildren.reduce((sum, c) => sum + c.progressLevel, 0) / allChildren.length
    : 0;

  const recentSessions = await db.select().from(sessionsTable).orderBy(sessionsTable.createdAt).limit(5);
  const upcomingAppointments = allAppointments.filter(a => a.date >= today && a.status === "scheduled").slice(0, 5);

  const buildSession = async (s: typeof sessionsTable.$inferSelect) => {
    const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, s.childId));
    const [specialist] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, s.specialistId));
    const [specialistUser] = specialist ? await db.select().from(usersTable).where(eq(usersTable.id, specialist.userId)) : [undefined];
    return { id: s.id, childId: s.childId, childName: child?.name ?? "Unknown", specialistId: s.specialistId, specialistName: specialistUser?.name ?? "Unknown", date: s.date, duration: s.duration, score: s.score ?? null, notes: s.notes ?? null, exercisesCompleted: s.exercisesCompleted, mood: s.mood ?? null, createdAt: s.createdAt.toISOString() };
  };

  const buildAppointment = async (a: typeof appointmentsTable.$inferSelect) => {
    const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, a.childId));
    const [specialist] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, a.specialistId));
    const [specialistUser] = specialist ? await db.select().from(usersTable).where(eq(usersTable.id, specialist.userId)) : [undefined];
    return { id: a.id, childId: a.childId, childName: child?.name ?? "Unknown", specialistId: a.specialistId, specialistName: specialistUser?.name ?? "Unknown", date: a.date, time: a.time, duration: a.duration, status: a.status, notes: a.notes ?? null, createdAt: a.createdAt.toISOString() };
  };

  res.json({
    totalChildren: totalChildrenRes?.count ?? 0,
    totalSpecialists: totalSpecialistsRes?.count ?? 0,
    totalParents: totalParentsRes?.count ?? 0,
    totalSessions: totalSessionsRes?.count ?? 0,
    appointmentsToday,
    appointmentsThisWeek,
    averageProgress,
    recentSessions: await Promise.all(recentSessions.map(buildSession)),
    upcomingAppointments: await Promise.all(upcomingAppointments.map(buildAppointment)),
  });
});

router.get("/dashboard/specialist/:specialistId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.specialistId) ? req.params.specialistId[0] : req.params.specialistId;
  const specialistId = parseInt(raw, 10);

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

  const allSessions = await db.select().from(sessionsTable).where(eq(sessionsTable.specialistId, specialistId));
  const sessionsThisWeek = allSessions.filter(s => s.date >= weekStart && s.date <= today).length;
  const sessionsThisMonth = allSessions.filter(s => s.date >= monthStart).length;
  const scoredSessions = allSessions.filter(s => s.score != null);
  const averageScore = scoredSessions.length > 0 ? scoredSessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / scoredSessions.length : 0;

  const activeChildrenRaw = await db.select().from(childrenTable).where(eq(childrenTable.specialistId, specialistId));
  const allAppointments = await db.select().from(appointmentsTable).where(eq(appointmentsTable.specialistId, specialistId));
  const upcomingAppointments = allAppointments.filter(a => a.date >= today && a.status === "scheduled");

  const buildSession = async (s: typeof sessionsTable.$inferSelect) => {
    const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, s.childId));
    const [specialist] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, s.specialistId));
    const [specialistUser] = specialist ? await db.select().from(usersTable).where(eq(usersTable.id, specialist.userId)) : [undefined];
    return { id: s.id, childId: s.childId, childName: child?.name ?? "Unknown", specialistId: s.specialistId, specialistName: specialistUser?.name ?? "Unknown", date: s.date, duration: s.duration, score: s.score ?? null, notes: s.notes ?? null, exercisesCompleted: s.exercisesCompleted, mood: s.mood ?? null, createdAt: s.createdAt.toISOString() };
  };
  const buildAppointment = async (a: typeof appointmentsTable.$inferSelect) => {
    const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, a.childId));
    const [specialist] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, a.specialistId));
    const [specialistUser] = specialist ? await db.select().from(usersTable).where(eq(usersTable.id, specialist.userId)) : [undefined];
    return { id: a.id, childId: a.childId, childName: child?.name ?? "Unknown", specialistId: a.specialistId, specialistName: specialistUser?.name ?? "Unknown", date: a.date, time: a.time, duration: a.duration, status: a.status, notes: a.notes ?? null, createdAt: a.createdAt.toISOString() };
  };

  res.json({
    activeChildren: activeChildrenRaw.length,
    sessionsThisWeek,
    sessionsThisMonth,
    averageScore,
    upcomingAppointments: await Promise.all(upcomingAppointments.slice(0, 10).map(buildAppointment)),
    recentSessions: await Promise.all(allSessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(buildSession)),
    children: activeChildrenRaw.map(c => ({
      id: c.id, name: c.name, age: c.age, gender: c.gender, parentId: c.parentId,
      specialistId: c.specialistId ?? null, diagnosis: c.diagnosis ?? null, notes: c.notes ?? null,
      progressLevel: c.progressLevel, totalSessions: c.totalSessions, createdAt: c.createdAt.toISOString(),
    })),
  });
});

router.get("/dashboard/parent/:parentId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.parentId) ? req.params.parentId[0] : req.params.parentId;
  const parentId = parseInt(raw, 10);

  const today = new Date().toISOString().split("T")[0];

  const children = await db.select().from(childrenTable).where(eq(childrenTable.parentId, parentId));
  const childIds = children.map(c => c.id);

  const allAppointments = childIds.length > 0
    ? await db.select().from(appointmentsTable).orderBy(appointmentsTable.date)
    : [];
  const filteredAppointments = allAppointments.filter(a => childIds.includes(a.childId));

  const allSessions = childIds.length > 0
    ? await db.select().from(sessionsTable).orderBy(sessionsTable.date)
    : [];
  const filteredSessions = allSessions.filter(s => childIds.includes(s.childId));

  const upcomingAppointments = filteredAppointments.filter(a => a.date >= today && a.status === "scheduled");
  const totalProgress = children.length > 0
    ? children.reduce((sum, c) => sum + c.progressLevel, 0) / children.length
    : 0;
  const lastSession = filteredSessions.sort((a, b) => b.date.localeCompare(a.date))[0];

  const buildAppointment = async (a: typeof appointmentsTable.$inferSelect) => {
    const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, a.childId));
    const [specialist] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, a.specialistId));
    const [specialistUser] = specialist ? await db.select().from(usersTable).where(eq(usersTable.id, specialist.userId)) : [undefined];
    return { id: a.id, childId: a.childId, childName: child?.name ?? "Unknown", specialistId: a.specialistId, specialistName: specialistUser?.name ?? "Unknown", date: a.date, time: a.time, duration: a.duration, status: a.status, notes: a.notes ?? null, createdAt: a.createdAt.toISOString() };
  };
  const buildSession = async (s: typeof sessionsTable.$inferSelect) => {
    const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, s.childId));
    const [specialist] = await db.select().from(specialistsTable).where(eq(specialistsTable.id, s.specialistId));
    const [specialistUser] = specialist ? await db.select().from(usersTable).where(eq(usersTable.id, specialist.userId)) : [undefined];
    return { id: s.id, childId: s.childId, childName: child?.name ?? "Unknown", specialistId: s.specialistId, specialistName: specialistUser?.name ?? "Unknown", date: s.date, duration: s.duration, score: s.score ?? null, notes: s.notes ?? null, exercisesCompleted: s.exercisesCompleted, mood: s.mood ?? null, createdAt: s.createdAt.toISOString() };
  };

  res.json({
    children: children.map(c => ({
      id: c.id, name: c.name, age: c.age, gender: c.gender, parentId: c.parentId,
      specialistId: c.specialistId ?? null, diagnosis: c.diagnosis ?? null, notes: c.notes ?? null,
      progressLevel: c.progressLevel, totalSessions: c.totalSessions, createdAt: c.createdAt.toISOString(),
    })),
    upcomingAppointments: await Promise.all(upcomingAppointments.slice(0, 5).map(buildAppointment)),
    recentSessions: await Promise.all(filteredSessions.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(buildSession)),
    totalProgress,
    lastSessionDate: lastSession?.date ?? null,
  });
});

router.get("/dashboard/child/:childId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.childId) ? req.params.childId[0] : req.params.childId;
  const childId = parseInt(raw, 10);

  const today = new Date().toISOString().split("T")[0];

  const [child] = await db.select().from(childrenTable).where(eq(childrenTable.id, childId));
  if (!child) {
    res.status(404).json({ error: "Child not found" });
    return;
  }

  // جلب كل التمارين المناسبة لعمر الطفل (minAge <= عمر الطفل <= maxAge)
  const allExercises = await db.select().from(exercisesTable)
    .where(and(lte(exercisesTable.minAge, child.age), gte(exercisesTable.maxAge, child.age)));

  // خلط بناءً على التاريخ + رقم الطفل → نفس اليوم = نفس التمارين، اليوم التالي = تمارين مختلفة
  const dateSeed = parseInt(today.replace(/-/g, ""), 10) + childId;
  function seededShuffle<T>(arr: T[], seed: number): T[] {
    const a = [...arr];
    let s = seed;
    for (let i = a.length - 1; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const shuffled = seededShuffle(allExercises, dateSeed);

  const todayExercises = shuffled.slice(0, 3).map(e => ({
    id: e.id, title: e.title, description: e.description, category: e.category, difficulty: e.difficulty,
    minAge: e.minAge, maxAge: e.maxAge, instructions: e.instructions, duration: e.duration, emoji: e.emoji,
    createdAt: e.createdAt.toISOString(),
  }));

  const allProgress = await db.select().from(progressTable).where(eq(progressTable.childId, childId));
  const recentProgress = allProgress.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const allAppointments = await db.select().from(appointmentsTable).where(eq(appointmentsTable.childId, childId));
  const nextAppointment = allAppointments.find(a => a.date >= today && a.status === "scheduled");

  const stars = allProgress.filter(p => p.completed).length * 10 + allProgress.reduce((sum, p) => sum + p.score, 0);
  const level = Math.floor(child.progressLevel / 20) + 1;

  const buildProgress = async (p: typeof progressTable.$inferSelect) => {
    const [exercise] = await db.select().from(exercisesTable).where(eq(exercisesTable.id, p.exerciseId));
    return { id: p.id, childId: p.childId, exerciseId: p.exerciseId, exerciseTitle: exercise?.title ?? "Unknown", score: p.score, completed: p.completed, date: p.date, notes: p.notes ?? null, createdAt: p.createdAt.toISOString() };
  };

  const streakDays = Math.min(child.totalSessions, 7);

  res.json({
    childName: child.name,
    stars,
    level,
    todayExercises,
    recentProgress: await Promise.all(recentProgress.map(buildProgress)),
    nextAppointment: nextAppointment ? `${nextAppointment.date} ${nextAppointment.time}` : null,
    streakDays,
  });
});

export default router;
