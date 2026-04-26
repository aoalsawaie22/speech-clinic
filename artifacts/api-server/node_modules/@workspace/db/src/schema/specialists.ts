import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const specialistsTable = pgTable("specialists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  specialty: text("specialty").notNull(),
  bio: text("bio"),
  experience: integer("experience"),
  rating: real("rating"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSpecialistSchema = createInsertSchema(specialistsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSpecialist = z.infer<typeof insertSpecialistSchema>;
export type Specialist = typeof specialistsTable.$inferSelect;
