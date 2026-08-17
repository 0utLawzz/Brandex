import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trademarksTable = pgTable("trademarks", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  prefix: text("prefix").notNull(), // X, A, N
  clientNo: text("client_no").notNull(), // e.g., 284, 006, 885
  caseNo: text("case_no").notNull(), // e.g., 001, 004
  folderNo: text("folder_no"),
  appName: text("app_name"),
  appClass: text("app_class"),
  tmNo: text("tm_no"),
  city: text("city").notNull(), // Islamabad, Karachi, Lahore, Peshawar
  stage: text("stage").notNull(), // STAGE 1, STAGE 2, STAGE 3, STAGE 4
  subStage: text("sub_stage").notNull(), // Examination, Assign Uzma (KRI), etc.
  status: text("status").notNull(), // Current status for workflow
  isDuplicate: boolean("is_duplicate").notNull().default(false),
  isTm11: boolean("is_tm11").notNull().default(false),
  notes: text("notes"),
  imageUrl: text("image_url"),
  pdfUrl: text("pdf_url"),
  clientName: text("client_name"), // Client full name
  caseType: text("case_type"), // Type/category of case
  assignedTo: text("assigned_to"), // agent key e.g. 'UZMA'
  source: text("source").notNull().default("local"), // 'local' or 'sheet'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const changeLogTable = pgTable("change_log", {
  id: serial("id").primaryKey(),
  trademarkId: integer("trademark_id").notNull().references(() => trademarksTable.id),
  field: text("field").notNull(), // Which field was changed
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  changedAt: timestamp("changed_at").defaultNow(),
  changedBy: text("changed_by").notNull().default("system"),
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

export const insertChangeLogSchema = createInsertSchema(changeLogTable).omit({
  id: true,
  changedAt: true,
});

export type InsertTrademark = z.infer<typeof insertTrademarkSchema>;
export type UpdateTrademark = z.infer<typeof updateTrademarkSchema>;
export type Trademark = typeof trademarksTable.$inferSelect;
export type ChangeLog = typeof changeLogTable.$inferSelect;
export type InsertChangeLog = z.infer<typeof insertChangeLogSchema>;
