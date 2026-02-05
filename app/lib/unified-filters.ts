import type { UnifiedRecord, RecordSource } from "./unified-types";

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

export interface UnifiedFilters {
  date: DateFilter;
  source: RecordSource;
  vendor?: string;
  category?: string;
}

export interface UnifiedSorting {
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

// --- Filtering ---

function matchesDateFilter(record: UnifiedRecord, filter: DateFilter): boolean {
  if (filter.mode === "all") return true;

  const date = parseDDMMYYYY(record.date);
  if (!date) return true;

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

export function filterRecords(records: UnifiedRecord[], filters: UnifiedFilters): UnifiedRecord[] {
  return records.filter((rec) => {
    if (!matchesDateFilter(rec, filters.date)) return false;
    if (filters.source !== "all" && rec.source !== filters.source) return false;
    if (filters.vendor && rec.vendorId !== filters.vendor) return false;
    if (filters.category && rec.category !== filters.category) return false;
    return true;
  });
}

// --- Sorting ---

export function sortRecords(
  records: UnifiedRecord[],
  sorting: UnifiedSorting | undefined
): UnifiedRecord[] {
  if (!sorting) return records;

  const { column, direction } = sorting;
  const isDateColumn = column === "date";
  const multiplier = direction === "asc" ? 1 : -1;

  return [...records].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[column];
    const bVal = (b as unknown as Record<string, unknown>)[column];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return multiplier;
    if (bVal == null) return -multiplier;

    if (isDateColumn) {
      const da = parseDDMMYYYY(String(aVal));
      const db = parseDDMMYYYY(String(bVal));
      if (!da && !db) return 0;
      if (!da) return multiplier;
      if (!db) return -multiplier;
      return (da.getTime() - db.getTime()) * multiplier;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      return aVal.localeCompare(bVal) * multiplier;
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * multiplier;
    }

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
      return filter.year != null ? String(filter.year) : "Ano";
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

export function getAvailableYears(records: UnifiedRecord[]): number[] {
  const years = new Set<number>();
  for (const rec of records) {
    const date = parseDDMMYYYY(rec.date);
    if (date) years.add(date.getFullYear());
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function getAvailableCategories(records: UnifiedRecord[]): string[] {
  const cats = new Set<string>();
  for (const rec of records) {
    if (rec.category) cats.add(rec.category);
  }
  return Array.from(cats).sort();
}
