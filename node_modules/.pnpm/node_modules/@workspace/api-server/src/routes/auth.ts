import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, specialistsTable, childrenTable } from "@workspace/db";

const router: IRouter = Router();

async function buildAuthUser(user: typeof usersTable.$inferSelect) {
  let specialistId: number | null = null;
  let parentId: number | null = null;
  let childId: number | null = null;

  if (user.role === "specialist") {
    const [s] = await db.select().from(specialistsTable).where(eq(specialistsTable.userId, user.id));
    specialistId = s?.id ?? null;
  } else if (user.role === "parent") {
    parentId = user.id;
  } else if (user.role === "child") {
    const [c] = await db.select().from(childrenTable).where(eq(childrenTable.name, user.name));
    childId = c?.id ?? null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    specialistId,
    parentId,
    childId,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = Buffer.from(`${user.id}:${user.role}:${Date.now()}`).toString("base64");
  const authUser = await buildAuthUser(user);

  res.json({ user: authUser, token });
});

router.post("/auth/logout", async (_req, res): Promise<void> => {
  res.json({ message: "Logged out" });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const decoded = Buffer.from(authHeader.replace("Bearer ", ""), "base64").toString();
    const [idStr] = decoded.split(":");
    const id = parseInt(idStr, 10);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!user) {
      res.status(401).json({ error: "User not found" });
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
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
