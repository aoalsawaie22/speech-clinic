import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { childrenTable } from "./children";
import { specialistsTable } from "./specialists";

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => childrenTable.id, { onDelete: "cascade" }),
  specialistId: integer("specialist_id").notNull().references(() => specialistsTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  duration: integer("duration").notNull().default(60),
  score: integer("score"),
  notes: text("notes"),
  exercisesCompleted: integer("exercises_completed").notNull().default(0),
  mood: text("mood"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSessionSchema = createInsertSchema(sessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
