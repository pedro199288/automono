import { eq, and, sql, inArray } from "drizzle-orm";
import { db } from "./index";
import { authTokens, invoices, vendors, settings, excludedFolders, financialMovements } from "./schema";
import crypto from "crypto";
import type { InvoiceRow, VendorRow, InvoiceWithVendor, ExcludedFolderRow, MovementRow, MovementWithVendor, MovementInsert } from "./zod-schemas";

// Re-export types from zod-schemas
export type { InvoiceRow, VendorRow, InvoiceWithVendor, ExcludedFolderRow, MovementRow, MovementWithVendor, MovementInsert } from "./zod-schemas";

// Settings
export function getSetting(key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

export function getAllSettings(): Record<string, string> {
  const rows = db.select().from(settings).all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// Auth tokens
export function getAuthTokens() {
  return db.select().from(authTokens).where(eq(authTokens.id, 1)).get() ?? null;
}

export function saveAuthTokens(accessToken: string, refreshToken: string, expiry: string): void {
  db.insert(authTokens)
    .values({ id: 1, access_token: accessToken, refresh_token: refreshToken, expiry })
    .onConflictDoUpdate({
      target: authTokens.id,
      set: { access_token: accessToken, refresh_token: refreshToken, expiry },
    })
    .run();
}

// Invoices
export function getInvoicesByType(folderType: InvoiceRow["folder_type"], trimestre?: string): InvoiceWithVendor[] {
  const conditions = trimestre
    ? and(eq(invoices.folder_type, folderType), eq(invoices.trimestre, trimestre))
    : eq(invoices.folder_type, folderType);

  return db
    .select({
      id: invoices.id,
      drive_file_id: invoices.drive_file_id,
      file_name: invoices.file_name,
      drive_path: invoices.drive_path,
      folder_type: invoices.folder_type,
      trimestre: invoices.trimestre,
      subfolder: invoices.subfolder,
      raw_text: invoices.raw_text,
      extracted_data: invoices.extracted_data,
      status: invoices.status,
      warning_message: invoices.warning_message,
      vendor_id: invoices.vendor_id,
      created_at: invoices.created_at,
      updated_at: invoices.updated_at,
      vendor_name: vendors.raw_name,
    })
    .from(invoices)
    .leftJoin(vendors, eq(invoices.vendor_id, vendors.id))
    .where(conditions)
    .orderBy(invoices.file_name)
    .all();
}

export function getInvoicesByTrimestre(trimestre: string, folderType?: InvoiceRow["folder_type"]): InvoiceWithVendor[] {
  const conditions = folderType
    ? and(eq(invoices.trimestre, trimestre), eq(invoices.folder_type, folderType))
    : eq(invoices.trimestre, trimestre);

  const rows = db
    .select({
      id: invoices.id,
      drive_file_id: invoices.drive_file_id,
      file_name: invoices.file_name,
      drive_path: invoices.drive_path,
      folder_type: invoices.folder_type,
      trimestre: invoices.trimestre,
      subfolder: invoices.subfolder,
      raw_text: invoices.raw_text,
      extracted_data: invoices.extracted_data,
      status: invoices.status,
      warning_message: invoices.warning_message,
      vendor_id: invoices.vendor_id,
      created_at: invoices.created_at,
      updated_at: invoices.updated_at,
      vendor_name: vendors.raw_name,
    })
    .from(invoices)
    .leftJoin(vendors, eq(invoices.vendor_id, vendors.id))
    .where(conditions)
    .orderBy(folderType ? invoices.file_name : invoices.folder_type, invoices.file_name)
    .all();

  return rows;
}

export function getInvoiceById(id: number): InvoiceWithVendor | null {
  const row = db
    .select({
      id: invoices.id,
      drive_file_id: invoices.drive_file_id,
      file_name: invoices.file_name,
      drive_path: invoices.drive_path,
      folder_type: invoices.folder_type,
      trimestre: invoices.trimestre,
      subfolder: invoices.subfolder,
      raw_text: invoices.raw_text,
      extracted_data: invoices.extracted_data,
      status: invoices.status,
      warning_message: invoices.warning_message,
      vendor_id: invoices.vendor_id,
      created_at: invoices.created_at,
      updated_at: invoices.updated_at,
      vendor_name: vendors.raw_name,
    })
    .from(invoices)
    .leftJoin(vendors, eq(invoices.vendor_id, vendors.id))
    .where(eq(invoices.id, id))
    .get();

  return row ?? null;
}

export function getInvoiceByDriveId(driveFileId: string): InvoiceRow | null {
  return db.select().from(invoices).where(eq(invoices.drive_file_id, driveFileId)).get() ?? null;
}

export function upsertInvoice(data: {
  drive_file_id: string;
  file_name: string;
  drive_path: string;
  folder_type: InvoiceRow["folder_type"];
  trimestre: string;
  subfolder?: string | null;
  raw_text?: string | null;
  status?: string;
  warning_message?: string | null;
}): void {
  db.insert(invoices)
    .values({
      drive_file_id: data.drive_file_id,
      file_name: data.file_name,
      drive_path: data.drive_path,
      folder_type: data.folder_type,
      trimestre: data.trimestre,
      subfolder: data.subfolder ?? null,
      raw_text: data.raw_text ?? null,
      status: data.status ?? "pending",
      warning_message: data.warning_message ?? null,
    })
    .onConflictDoUpdate({
      target: invoices.drive_file_id,
      set: {
        file_name: sql`excluded.file_name`,
        drive_path: sql`excluded.drive_path`,
        folder_type: sql`excluded.folder_type`,
        subfolder: sql`excluded.subfolder`,
        raw_text: sql`COALESCE(excluded.raw_text, ${invoices.raw_text})`,
        status: sql`CASE WHEN ${invoices.status} = 'processed' THEN ${invoices.status} ELSE COALESCE(excluded.status, ${invoices.status}) END`,
        warning_message: sql`CASE WHEN ${invoices.status} = 'processed' THEN NULL ELSE excluded.warning_message END`,
        updated_at: sql`CURRENT_TIMESTAMP`,
      },
    })
    .run();
}

export function updateInvoiceExtractedData(id: number, extractedData: string, status: string): void {
  db.update(invoices)
    .set({ extracted_data: extractedData, status, warning_message: sql`NULL`, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(invoices.id, id))
    .run();
}

export function updateInvoiceStatus(id: number, status: string, warningMessage?: string): void {
  db.update(invoices)
    .set({ status, warning_message: warningMessage ?? sql`NULL`, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(invoices.id, id))
    .run();
}

export function getAllTrimestres(): string[] {
  const rows = db
    .selectDistinct({ trimestre: invoices.trimestre })
    .from(invoices)
    .orderBy(invoices.trimestre)
    .all();
  return rows.map((r) => r.trimestre);
}

export function getTrimestreInvoiceCount(trimestre: string): number {
  const row = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(invoices)
    .where(eq(invoices.trimestre, trimestre))
    .get();
  return row?.count ?? 0;
}

export function getTrimestreStats(trimestre: string) {
  return db
    .select({
      folder_type: invoices.folder_type,
      total: sql<number>`COUNT(*)`,
      processed: sql<number>`SUM(CASE WHEN ${invoices.status} = 'processed' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN ${invoices.status} = 'pending' THEN 1 ELSE 0 END)`,
      warnings: sql<number>`SUM(CASE WHEN ${invoices.status} = 'warning' THEN 1 ELSE 0 END)`,
      errors: sql<number>`SUM(CASE WHEN ${invoices.status} = 'error' THEN 1 ELSE 0 END)`,
    })
    .from(invoices)
    .where(eq(invoices.trimestre, trimestre))
    .groupBy(invoices.folder_type)
    .all();
}

// Vendors
export function getAllVendors(type?: string): VendorRow[] {
  if (type) {
    return db.select().from(vendors).where(eq(vendors.type, type)).orderBy(vendors.raw_name).all();
  }
  return db.select().from(vendors).orderBy(vendors.raw_name).all();
}

export function getVendorByRawName(rawName: string, type?: string): VendorRow | null {
  const conditions = type
    ? and(sql`LOWER(${vendors.raw_name}) = LOWER(${rawName})`, eq(vendors.type, type))
    : sql`LOWER(${vendors.raw_name}) = LOWER(${rawName})`;
  return db.select().from(vendors).where(conditions).get() ?? null;
}

export function findOrCreateVendor(rawName: string, type?: string): VendorRow {
  const existing = getVendorByRawName(rawName, type);
  if (existing) return existing;

  const id = crypto.randomUUID().slice(0, 8);
  const vendorType = type ?? "provider";
  db.insert(vendors).values({ id, raw_name: rawName, type: vendorType }).run();
  return db.select().from(vendors).where(eq(vendors.id, id)).get()!;
}

export function createVendor(data: { raw_name: string; type?: string }): VendorRow {
  const id = crypto.randomUUID().slice(0, 8);
  db.insert(vendors).values({
    id,
    raw_name: data.raw_name,
    type: data.type ?? "provider",
  }).run();
  return db.select().from(vendors).where(eq(vendors.id, id)).get()!;
}

export function setInvoiceVendor(invoiceId: number, vendorId: string): void {
  db.update(invoices)
    .set({ vendor_id: vendorId, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(invoices.id, invoiceId))
    .run();
}

export function clearInvoiceVendor(invoiceId: number): void {
  db.update(invoices)
    .set({ vendor_id: sql`NULL`, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(invoices.id, invoiceId))
    .run();
}

export function deleteVendor(id: string): void {
  db.update(invoices)
    .set({ vendor_id: sql`NULL`, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(invoices.vendor_id, id))
    .run();
  db.delete(vendors).where(eq(vendors.id, id)).run();
}

export function clearInvoiceVendorAndField(invoiceId: number, fieldName: string): void {
  const invoice = db.select({ extracted_data: invoices.extracted_data })
    .from(invoices).where(eq(invoices.id, invoiceId)).get();

  let newExtractedData = invoice?.extracted_data ?? null;
  if (newExtractedData) {
    try {
      const parsed = JSON.parse(newExtractedData);
      parsed[fieldName] = null;
      newExtractedData = JSON.stringify(parsed);
    } catch { /* mantener original */ }
  }

  db.update(invoices)
    .set({ vendor_id: sql`NULL`, extracted_data: newExtractedData, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(invoices.id, invoiceId))
    .run();
}

// Delete invoices by subfolder + cleanup orphan vendors
export function deleteInvoicesBySubfolder(trimestre: string, subfolder: string): { deletedInvoices: number; deletedVendors: number } {
  const matchingInvoices = db
    .select({ id: invoices.id, vendor_id: invoices.vendor_id })
    .from(invoices)
    .where(and(eq(invoices.trimestre, trimestre), eq(invoices.subfolder, subfolder)))
    .all();

  if (matchingInvoices.length === 0) {
    return { deletedInvoices: 0, deletedVendors: 0 };
  }

  const vendorIds = [...new Set(matchingInvoices.map((i) => i.vendor_id).filter(Boolean))] as string[];
  const invoiceIds = matchingInvoices.map((i) => i.id);

  db.delete(invoices).where(inArray(invoices.id, invoiceIds)).run();

  let deletedVendors = 0;
  for (const vendorId of vendorIds) {
    const remaining = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(eq(invoices.vendor_id, vendorId))
      .get();
    if ((remaining?.count ?? 0) === 0) {
      db.delete(vendors).where(eq(vendors.id, vendorId)).run();
      deletedVendors++;
    }
  }

  return { deletedInvoices: invoiceIds.length, deletedVendors };
}

// Excluded folders
export function getExcludedFolderIds(): string[] {
  return db.select({ id: excludedFolders.drive_folder_id }).from(excludedFolders).all().map((r) => r.id);
}

export function getExcludedFolders(): ExcludedFolderRow[] {
  return db.select().from(excludedFolders).all();
}

export function excludeFolder(driveFolderId: string, folderName: string): void {
  db.insert(excludedFolders)
    .values({ drive_folder_id: driveFolderId, folder_name: folderName })
    .onConflictDoNothing()
    .run();
}

export function removeExclusion(driveFolderId: string): void {
  db.delete(excludedFolders).where(eq(excludedFolders.drive_folder_id, driveFolderId)).run();
}

export function isFolderExcluded(driveFolderId: string): boolean {
  const row = db.select().from(excludedFolders).where(eq(excludedFolders.drive_folder_id, driveFolderId)).get();
  return !!row;
}

// Delete single invoice by ID and cleanup orphan vendor
export function deleteInvoiceById(id: number): { deleted: boolean; deletedVendor: boolean } {
  const invoice = db.select({ vendor_id: invoices.vendor_id })
    .from(invoices).where(eq(invoices.id, id)).get();

  if (!invoice) return { deleted: false, deletedVendor: false };

  db.delete(invoices).where(eq(invoices.id, id)).run();

  // Cleanup orphan vendor
  let deletedVendor = false;
  if (invoice.vendor_id) {
    const remaining = db.select({ count: sql<number>`COUNT(*)` })
      .from(invoices).where(eq(invoices.vendor_id, invoice.vendor_id)).get();
    if ((remaining?.count ?? 0) === 0) {
      db.delete(vendors).where(eq(vendors.id, invoice.vendor_id)).run();
      deletedVendor = true;
    }
  }

  return { deleted: true, deletedVendor };
}

// Financial Movements
export function getMovementsByType(type?: MovementRow["type"], trimestre?: string): MovementWithVendor[] {
  let conditions;
  if (type && trimestre) {
    conditions = and(eq(financialMovements.type, type), eq(financialMovements.trimestre, trimestre));
  } else if (type) {
    conditions = eq(financialMovements.type, type);
  } else if (trimestre) {
    conditions = eq(financialMovements.trimestre, trimestre);
  }

  return db
    .select({
      id: financialMovements.id,
      type: financialMovements.type,
      category: financialMovements.category,
      date: financialMovements.date,
      description: financialMovements.description,
      amount: financialMovements.amount,
      tax_base: financialMovements.tax_base,
      vat_rate: financialMovements.vat_rate,
      vat_amount: financialMovements.vat_amount,
      currency: financialMovements.currency,
      trimestre: financialMovements.trimestre,
      reference: financialMovements.reference,
      vendor_id: financialMovements.vendor_id,
      notes: financialMovements.notes,
      created_at: financialMovements.created_at,
      updated_at: financialMovements.updated_at,
      vendor_name: vendors.raw_name,
    })
    .from(financialMovements)
    .leftJoin(vendors, eq(financialMovements.vendor_id, vendors.id))
    .where(conditions)
    .orderBy(financialMovements.date)
    .all();
}

export function getMovementById(id: number): MovementWithVendor | null {
  const row = db
    .select({
      id: financialMovements.id,
      type: financialMovements.type,
      category: financialMovements.category,
      date: financialMovements.date,
      description: financialMovements.description,
      amount: financialMovements.amount,
      tax_base: financialMovements.tax_base,
      vat_rate: financialMovements.vat_rate,
      vat_amount: financialMovements.vat_amount,
      currency: financialMovements.currency,
      trimestre: financialMovements.trimestre,
      reference: financialMovements.reference,
      vendor_id: financialMovements.vendor_id,
      notes: financialMovements.notes,
      created_at: financialMovements.created_at,
      updated_at: financialMovements.updated_at,
      vendor_name: vendors.raw_name,
    })
    .from(financialMovements)
    .leftJoin(vendors, eq(financialMovements.vendor_id, vendors.id))
    .where(eq(financialMovements.id, id))
    .get();

  return row ?? null;
}

export function createMovement(data: Omit<MovementInsert, "id" | "created_at" | "updated_at">): MovementRow {
  const result = db.insert(financialMovements).values(data).returning().get();
  return result;
}

export function updateMovement(id: number, data: Partial<Omit<MovementInsert, "id" | "created_at" | "updated_at">>): MovementRow | null {
  const result = db
    .update(financialMovements)
    .set({ ...data, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(financialMovements.id, id))
    .returning()
    .get();
  return result ?? null;
}

export function deleteMovement(id: number): boolean {
  const existing = db.select({ id: financialMovements.id }).from(financialMovements).where(eq(financialMovements.id, id)).get();
  if (!existing) return false;
  db.delete(financialMovements).where(eq(financialMovements.id, id)).run();
  return true;
}

export function getAllMovementTrimestres(): string[] {
  const rows = db
    .selectDistinct({ trimestre: financialMovements.trimestre })
    .from(financialMovements)
    .orderBy(financialMovements.trimestre)
    .all();
  return rows.map((r) => r.trimestre);
}

// Financial summary combining invoices and movements
export interface FinancialSummary {
  invoices: { ingresos: number; gastos: number };
  movements: { ingresos: number; gastos: number };
  totals: { ingresos: number; gastos: number; balance: number };
}

// Unified Records (facturas + movimientos)
export interface UnifiedRecord {
  id: string;
  source: "invoice" | "movement";
  type: "gastos" | "ingresos";
  date: string;
  description: string;
  amount: number;
  taxBase: number | null;
  vatRate: number | null;
  category: string | null;
  vendorId: string | null;
  vendorName: string | null;
  trimestre: string;
  invoiceData?: {
    fileName: string;
    status: string;
    driveFileId: string;
  };
  movementData?: {
    reference: string | null;
    notes: string | null;
  };
}

export function getUnifiedRecords(type: "gastos" | "ingresos"): {
  records: UnifiedRecord[];
  stats: { invoiceCount: number; movementCount: number; totalAmount: number };
} {
  const records: UnifiedRecord[] = [];

  // Get invoices
  const invoiceRows = db
    .select({
      id: invoices.id,
      drive_file_id: invoices.drive_file_id,
      file_name: invoices.file_name,
      folder_type: invoices.folder_type,
      trimestre: invoices.trimestre,
      extracted_data: invoices.extracted_data,
      status: invoices.status,
      vendor_id: invoices.vendor_id,
      vendor_name: vendors.raw_name,
    })
    .from(invoices)
    .leftJoin(vendors, eq(invoices.vendor_id, vendors.id))
    .where(eq(invoices.folder_type, type))
    .all();

  for (const inv of invoiceRows) {
    let date = "";
    let description = inv.file_name;
    let amount = 0;
    let taxBase: number | null = null;
    let vatRate: number | null = null;
    let category: string | null = null;

    if (inv.extracted_data) {
      try {
        const data = JSON.parse(inv.extracted_data);
        if (type === "gastos") {
          date = data.fecha ?? "";
          description = data.concepto ?? inv.file_name;
          amount = Number(data.total) || 0;
          taxBase = data.base_imponible != null ? Number(data.base_imponible) : null;
          vatRate = data.tipo_iva != null ? Number(data.tipo_iva) : null;
          category = data.categoria ?? null;
        } else {
          date = data.fecha_factura ?? "";
          description = data.concepto ?? data.descripcion ?? inv.file_name;
          amount = Number(data.total_factura) || Number(data.total) || 0;
          taxBase = data.base_imponible != null ? Number(data.base_imponible) : null;
          vatRate = data.tipo_iva != null ? Number(data.tipo_iva) : null;
        }
      } catch { /* skip */ }
    }

    records.push({
      id: `inv-${inv.id}`,
      source: "invoice",
      type,
      date,
      description,
      amount,
      taxBase,
      vatRate,
      category,
      vendorId: inv.vendor_id,
      vendorName: inv.vendor_name,
      trimestre: inv.trimestre,
      invoiceData: {
        fileName: inv.file_name,
        status: inv.status,
        driveFileId: inv.drive_file_id,
      },
    });
  }

  // Get movements
  const movementType = type; // ya es "gastos" o "ingresos"
  const movementRows = db
    .select({
      id: financialMovements.id,
      type: financialMovements.type,
      category: financialMovements.category,
      date: financialMovements.date,
      description: financialMovements.description,
      amount: financialMovements.amount,
      tax_base: financialMovements.tax_base,
      vat_rate: financialMovements.vat_rate,
      trimestre: financialMovements.trimestre,
      reference: financialMovements.reference,
      notes: financialMovements.notes,
      vendor_id: financialMovements.vendor_id,
      vendor_name: vendors.raw_name,
    })
    .from(financialMovements)
    .leftJoin(vendors, eq(financialMovements.vendor_id, vendors.id))
    .where(eq(financialMovements.type, movementType))
    .all();

  for (const mov of movementRows) {
    records.push({
      id: `mov-${mov.id}`,
      source: "movement",
      type,
      date: mov.date,
      description: mov.description,
      amount: mov.amount,
      taxBase: mov.tax_base,
      vatRate: mov.vat_rate,
      category: mov.category,
      vendorId: mov.vendor_id,
      vendorName: mov.vendor_name,
      trimestre: mov.trimestre,
      movementData: {
        reference: mov.reference,
        notes: mov.notes,
      },
    });
  }

  // Sort by date descending (most recent first)
  records.sort((a, b) => {
    const parseDate = (s: string) => {
      const match = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
      if (!match) return 0;
      return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])).getTime();
    };
    return parseDate(b.date) - parseDate(a.date);
  });

  const stats = {
    invoiceCount: invoiceRows.length,
    movementCount: movementRows.length,
    totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
  };

  return { records, stats };
}

export function getFinancialSummary(trimestre?: string): FinancialSummary {
  // Get invoice totals from extracted_data
  const invoicesCondition = trimestre ? eq(invoices.trimestre, trimestre) : undefined;
  const invoiceRows = db
    .select({
      folder_type: invoices.folder_type,
      extracted_data: invoices.extracted_data,
    })
    .from(invoices)
    .where(invoicesCondition)
    .all();

  let invoiceIngresos = 0;
  let invoiceGastos = 0;
  for (const inv of invoiceRows) {
    if (!inv.extracted_data) continue;
    try {
      const data = JSON.parse(inv.extracted_data);
      const amount = data.total ?? data.total_factura ?? 0;
      if (inv.folder_type === "ingresos") {
        invoiceIngresos += Number(amount) || 0;
      } else {
        invoiceGastos += Number(amount) || 0;
      }
    } catch { /* skip invalid */ }
  }

  // Get movement totals
  const movementsCondition = trimestre ? eq(financialMovements.trimestre, trimestre) : undefined;
  const movementRows = db
    .select({
      type: financialMovements.type,
      amount: financialMovements.amount,
    })
    .from(financialMovements)
    .where(movementsCondition)
    .all();

  let movementIngresos = 0;
  let movementGastos = 0;
  for (const mov of movementRows) {
    if (mov.type === "ingresos") {
      movementIngresos += mov.amount;
    } else {
      movementGastos += mov.amount;
    }
  }

  const totalIngresos = invoiceIngresos + movementIngresos;
  const totalGastos = invoiceGastos + movementGastos;

  return {
    invoices: { ingresos: invoiceIngresos, gastos: invoiceGastos },
    movements: { ingresos: movementIngresos, gastos: movementGastos },
    totals: { ingresos: totalIngresos, gastos: totalGastos, balance: totalIngresos - totalGastos },
  };
}
