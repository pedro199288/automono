import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const authTokens = sqliteTable("auth_tokens", {
  id: integer().primaryKey({ autoIncrement: false }).default(1),
  access_token: text().notNull(),
  refresh_token: text().notNull(),
  expiry: text().notNull(),
});

export const vendors = sqliteTable("vendors", {
  id: text().primaryKey(),
  raw_name: text().notNull(),
  label: text(),
  type: text().notNull().default("provider"),
  created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
});

export const invoices = sqliteTable("invoices", {
  id: integer().primaryKey({ autoIncrement: true }),
  drive_file_id: text().notNull().unique(),
  file_name: text().notNull(),
  drive_path: text().notNull(),
  folder_type: text({ enum: ["gastos", "ingresos"] }).notNull(),
  trimestre: text().notNull(),
  subfolder: text(),
  raw_text: text(),
  extracted_data: text(),
  status: text().notNull().default("pending"),
  warning_message: text(),
  vendor_id: text().references(() => vendors.id),
  created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text().default(sql`(CURRENT_TIMESTAMP)`),
});

export const excludedFolders = sqliteTable("excluded_folders", {
  drive_folder_id: text().primaryKey(),
  folder_name: text().notNull(),
  created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
});

export const settings = sqliteTable("settings", {
  key: text().primaryKey(),
  value: text().notNull(),
});

export const financialMovements = sqliteTable("financial_movements", {
  id: integer().primaryKey({ autoIncrement: true }),
  type: text({ enum: ["ingresos", "gastos"] }).notNull(),
  category: text().notNull(),
  date: text().notNull(), // DD/MM/YYYY
  description: text().notNull(),
  amount: real().notNull(), // monto total
  tax_base: real(), // base imponible (opcional)
  vat_rate: real(), // % IVA (opcional)
  vat_amount: real(), // importe IVA (opcional)
  currency: text().notNull().default("EUR"),
  trimestre: text().notNull(), // ej: "2024-Q1"
  reference: text(), // num. referencia/recibo
  vendor_id: text().references(() => vendors.id),
  notes: text(),
  created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text().default(sql`(CURRENT_TIMESTAMP)`),
});
