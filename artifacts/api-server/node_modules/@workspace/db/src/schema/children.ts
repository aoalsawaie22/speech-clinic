import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { specialistsTable } from "./specialists";

export const childrenTable = pgTable("children", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender", { enum: ["male", "female"] }).notNull(),
  parentId: integer("parent_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  specialistId: integer("specialist_id").references(() => specialistsTable.id, { onDelete: "set null" }),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  progressLevel: integer("progress_level").notNull().default(0),
  totalSessions: integer("total_sessions").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertChildSchema = createInsertSchema(childrenTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof childrenTable.$inferSelect;
