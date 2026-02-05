import { createSelectSchema, createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { authTokens, vendors, invoices, settings, excludedFolders, financialMovements } from "./schema";

// Select schemas (para validar datos leídos de la DB)
export const authTokensSelectSchema = createSelectSchema(authTokens);
export const vendorsSelectSchema = createSelectSchema(vendors);
export const invoicesSelectSchema = createSelectSchema(invoices);
export const settingsSelectSchema = createSelectSchema(settings);
export const excludedFoldersSelectSchema = createSelectSchema(excludedFolders);

// Insert schemas (para validar datos al insertar)
export const vendorsInsertSchema = createInsertSchema(vendors);
export const invoicesInsertSchema = createInsertSchema(invoices);

// Update schemas (para validar datos parciales al actualizar)
export const vendorsUpdateSchema = createUpdateSchema(vendors);
export const invoicesUpdateSchema = createUpdateSchema(invoices);

// Tipos derivados
export type InvoiceRow = z.infer<typeof invoicesSelectSchema>;
export type VendorRow = z.infer<typeof vendorsSelectSchema>;
export type AuthTokenRow = z.infer<typeof authTokensSelectSchema>;
export type SettingRow = z.infer<typeof settingsSelectSchema>;
export type ExcludedFolderRow = z.infer<typeof excludedFoldersSelectSchema>;

// Tipo compuesto para invoice con datos de vendor (JOIN)
export type InvoiceWithVendor = InvoiceRow & {
  vendor_name: string | null;
};

// Financial Movements schemas
export const financialMovementsSelectSchema = createSelectSchema(financialMovements);
export const financialMovementsInsertSchema = createInsertSchema(financialMovements);
export const financialMovementsUpdateSchema = createUpdateSchema(financialMovements);

export type MovementRow = z.infer<typeof financialMovementsSelectSchema>;
export type MovementInsert = z.infer<typeof financialMovementsInsertSchema>;
export type MovementUpdate = z.infer<typeof financialMovementsUpdateSchema>;

// Tipo compuesto para movement con datos de vendor (JOIN)
export type MovementWithVendor = MovementRow & {
  vendor_name: string | null;
};
