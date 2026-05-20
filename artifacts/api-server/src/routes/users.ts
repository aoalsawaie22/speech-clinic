import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone ?? null,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.post("/users", async (req, res): Promise<void> => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Check duplicate email first
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(400).json({ error: "هذا الإيميل مستخدم مسبقاً — اختر إيميلاً آخر" });
    return;
  }

  try {
    const [user] = await db.insert(usersTable).values({ name, email, password, role, phone: phone ?? null }).returning();
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch {
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الحساب" });
  }
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, email, phone } = req.body;

  const [user] = await db.update(usersTable).set({
    ...(name != null && { name }),
    ...(email != null && { email }),
    ...(phone != null && { phone }),
  }).where(eq(usersTable.id, id)).returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;