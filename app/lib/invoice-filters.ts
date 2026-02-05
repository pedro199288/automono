import type { InvoiceWithVendor } from "~/lib/types";

// --- Types ---

export type DateFilterMode = "all" | "quarter" | "year" | "month" | "custom";

export interface DateFilter {
  mode: DateFilterMode;
  year?: number;
  quarter?: number; // 1-4
  month?: number; // 0-11
  from?: string; // DD/MM/YYYY
  to?: string; // DD/MM/YYYY
}

export interface InvoiceFilters {
  date: DateFilter;
  vendor?: string; // vendor_id
  category?: string;
}

export interface InvoiceSorting {
  column: string;
  direction: "asc" | "desc";
}

// --- Date parsing ---

export function parseDDMMYYYY(str: string | null | undefined): Date | null {
  if (!str) return null;
  const match = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (isNaN(d.getTime())) return null;
  return d;
}

// --- Invoice field accessors ---

export function getInvoiceDate(invoice: InvoiceWithVendor): Date | null {
  if (!invoice.extracted_data) return null;
  try {
    const data = JSON.parse(invoice.extracted_data);
    const raw = invoice.folder_type === "gastos" ? data.fecha : data.fecha_factura;
    return parseDDMMYYYY(raw);
  } catch {
    return null;
  }
}

export function getInvoiceCategory(invoice: InvoiceWithVendor): string | null {
  if (invoice.folder_type !== "gastos" || !invoice.extracted_data) return null;
  try {
    const data = JSON.parse(invoice.extracted_data);
    return data.categoria ?? null;
  } catch {
    return null;
  }
}

// --- Filtering ---

function matchesDateFilter(invoice: InvoiceWithVendor, filter: DateFilter): boolean {
  if (filter.mode === "all") return true;

  const date = getInvoiceDate(invoice);
  if (!date) return true; // show invoices without date

  switch (filter.mode) {
    case "year":
      return filter.year != null && date.getFullYear() === filter.year;
    case "quarter": {
      if (filter.year == null || filter.quarter == null) return true;
      const q = Math.floor(date.getMonth() / 3) + 1;
      return date.getFullYear() === filter.year && q === filter.quarter;
    }
    case "month":
      return (
        filter.year != null &&
        filter.month != null &&
        date.getFullYear() === filter.year &&
        date.getMonth() === filter.month
      );
    case "custom": {
      const from = parseDDMMYYYY(filter.from);
      const to = parseDDMMYYYY(filter.to);
      if (from && date < from) return false;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        if (date > toEnd) return false;
      }
      return true;
    }
    default:
      return true;
  }
}

export function filterInvoices(invoices: InvoiceWithVendor[], filters: InvoiceFilters): InvoiceWithVendor[] {
  return invoices.filter((inv) => {
    if (!matchesDateFilter(inv, filters.date)) return false;
    if (filters.vendor && inv.vendor_id !== filters.vendor) return false;
    if (filters.category) {
      const cat = getInvoiceCategory(inv);
      if (cat !== filters.category) return false;
    }
    return true;
  });
}

// --- Sorting ---

function getExtractedField(invoice: InvoiceWithVendor, field: string): unknown {
  if (field === "file_name") return invoice.file_name;
  if (!invoice.extracted_data) return null;
  try {
    const data = JSON.parse(invoice.extracted_data);
    return data[field] ?? null;
  } catch {
    return null;
  }
}

export function sortInvoices(
  invoices: InvoiceWithVendor[],
  sorting: InvoiceSorting | undefined
): InvoiceWithVendor[] {
  if (!sorting) return invoices;

  const { column, direction } = sorting;
  const isDateColumn = column === "fecha" || column === "fecha_factura";
  const multiplier = direction === "asc" ? 1 : -1;

  return [...invoices].sort((a, b) => {
    const aVal = getExtractedField(a, column);
    const bVal = getExtractedField(b, column);

    // Handle nulls
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return multiplier;
    if (bVal == null) return -multiplier;

    // Date comparison
    if (isDateColumn) {
      const da = parseDDMMYYYY(String(aVal));
      const db = parseDDMMYYYY(String(bVal));
      if (!da && !db) return 0;
      if (!da) return multiplier;
      if (!db) return -multiplier;
      return (da.getTime() - db.getTime()) * multiplier;
    }

    // String comparison
    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * multiplier;
    }

    // Number comparison
    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * multiplier;
    }

    // Fallback to string comparison
    return String(aVal).localeCompare(String(bVal)) * multiplier;
  });
}

// --- Label helpers ---

const quarterLabels = ["Q1", "Q2", "Q3", "Q4"];
const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function getDateFilterLabel(filter: DateFilter): string {
  switch (filter.mode) {
    case "all":
      return "Todas las fechas";
    case "quarter":
      return filter.year != null && filter.quarter != null
        ? `${quarterLabels[filter.quarter - 1]} ${filter.year}`
        : "Trimestre";
    case "year":
      return filter.year != null ? String(filter.year) : "Año";
    case "month":
      return filter.year != null && filter.month != null
        ? `${monthLabels[filter.month]} ${filter.year}`
        : "Mes";
    case "custom": {
      const parts: string[] = [];
      if (filter.from) parts.push(`desde ${filter.from}`);
      if (filter.to) parts.push(`hasta ${filter.to}`);
      return parts.length > 0 ? parts.join(" ") : "Rango";
    }
    default:
      return "Fecha";
  }
}

// --- Helpers for available values ---

export function getAvailableYears(invoices: InvoiceWithVendor[]): number[] {
  const years = new Set<number>();
  for (const inv of invoices) {
    const date = getInvoiceDate(inv);
    if (date) years.add(date.getFullYear());
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function getAvailableCategories(invoices: InvoiceWithVendor[]): string[] {
  const cats = new Set<string>();
  for (const inv of invoices) {
    const cat = getInvoiceCategory(inv);
    if (cat) cats.add(cat);
  }
  return Array.from(cats).sort();
}
