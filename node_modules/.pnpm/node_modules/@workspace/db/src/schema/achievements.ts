import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { childrenTable } from "./children";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  titleEn: text("title_en").notNull(),
  description: text("description").notNull(),
  descriptionEn: text("description_en").notNull(),
  emoji: text("emoji").notNull().default("🏆"),
  points: integer("points").notNull().default(10),
  threshold: integer("threshold").notNull().default(1),
  category: text("category", { enum: ["sessions", "exercises", "streak", "score", "special"] }).notNull().default("special"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const childAchievementsTable = pgTable("child_achievements", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull().references(() => childrenTable.id, { onDelete: "cascade" }),
  achievementId: integer("achievement_id").notNull().references(() => achievementsTable.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAchievementSchema = createInsertSchema(achievementsTable).omit({ id: true, createdAt: true });
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievementsTable.$inferSelect;
export type ChildAchievement = typeof childAchievementsTable.$inferSelect;
