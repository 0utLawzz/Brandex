import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trademarksTable = pgTable("trademarks", {
  id: serial("id").primaryKey(),
  date: text("date"),
  folderNo: text("folder_no"),
  appName: text("app_name"),
  appClass: text("app_class"),
  tmNo: text("tm_no"),
  stage: text("stage"),
  subStage: text("sub_stage"),
  isDuplicate: boolean("is_duplicate").notNull().default(false),
  isTm11: boolean("is_tm11").notNull().default(false),
  notes: text("notes"),
  city: text("city"),
  source: text("source").notNull().default("local"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTrademarkSchema = createInsertSchema(trademarksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTrademarkSchema = createUpdateSchema(trademarksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTrademark = z.infer<typeof insertTrademarkSchema>;
export type UpdateTrademark = z.infer<typeof updateTrademarkSchema>;
export type Trademark = typeof trademarksTable.$inferSelect;
