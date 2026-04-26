import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, exercisesTable } from "@workspace/db";

const router: IRouter = Router();

function buildExerciseResponse(e: typeof exercisesTable.$inferSelect) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    category: e.category,
    difficulty: e.difficulty,
    minAge: e.minAge,
    maxAge: e.maxAge,
    instructions: e.instructions,
    duration: e.duration,
    emoji: e.emoji,
    createdAt: e.createdAt.toISOString(),
  };
}

router.get("/exercises", async (req, res): Promise<void> => {
  const { category, difficulty, minAge, maxAge } = req.query;
  const conditions = [];
  if (category) conditions.push(eq(exercisesTable.category, category as string));
  if (difficulty) conditions.push(eq(exercisesTable.difficulty, difficulty as string));
  if (minAge) conditions.push(gte(exercisesTable.minAge, parseInt(minAge as string, 10)));
  if (maxAge) conditions.push(lte(exercisesTable.maxAge, parseInt(maxAge as string, 10)));

  const exercises = conditions.length > 0
    ? await db.select().from(exercisesTable).where(and(...conditions)).orderBy(exercisesTable.createdAt)
    : await db.select().from(exercisesTable).orderBy(exercisesTable.createdAt);

  res.json(exercises.map(buildExerciseResponse));
});

router.post("/exercises", async (req, res): Promise<void> => {
  const { title, description, category, difficulty, minAge, maxAge, instructions, duration, emoji } = req.body;
  if (!title || !description || !category || !difficulty || !instructions || !emoji) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [exercise] = await db.insert(exercisesTable).values({
    title, description, category, difficulty,
    minAge: minAge ?? 2,
    maxAge: maxAge ?? 5,
    instructions,
    duration: duration ?? 10,
    emoji,
  }).returning();
  res.status(201).json(buildExerciseResponse(exercise));
});

router.get("/exercises/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [exercise] = await db.select().from(exercisesTable).where(eq(exercisesTable.id, id));
  if (!exercise) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }
  res.json(buildExerciseResponse(exercise));
});

router.patch("/exercises/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { title, description, category, difficulty, instructions, duration } = req.body;

  const [exercise] = await db.update(exercisesTable).set({
    ...(title != null && { title }),
    ...(description != null && { description }),
    ...(category != null && { category }),
    ...(difficulty != null && { difficulty }),
    ...(instructions != null && { instructions }),
    ...(duration != null && { duration }),
  }).where(eq(exercisesTable.id, id)).returning();

  if (!exercise) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }
  res.json(buildExerciseResponse(exercise));
});

router.delete("/exercises/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [exercise] = await db.delete(exercisesTable).where(eq(exercisesTable.id, id)).returning();
  if (!exercise) {
    res.status(404).json({ error: "Exercise not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
