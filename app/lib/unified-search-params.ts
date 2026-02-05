import type { DateFilterMode, UnifiedFilters, UnifiedSorting } from "./unified-filters";
import type { RecordSource } from "./unified-types";

// Short param keys
const PARAM = {
  dateMode: "dm",
  dateYear: "dy",
  dateQuarter: "dq",
  dateMonth: "dmo",
  dateFrom: "df",
  dateTo: "dt",
  source: "src",
  vendor: "vendor",
  category: "cat",
  sort: "sort",
  direction: "dir",
} as const;

export function filtersToSearchParams(filters: UnifiedFilters, sorting?: UnifiedSorting): URLSearchParams {
  const params = new URLSearchParams();

  // Date filter
  if (filters.date.mode !== "all") {
    params.set(PARAM.dateMode, filters.date.mode);
    if (filters.date.year != null) params.set(PARAM.dateYear, String(filters.date.year));
    if (filters.date.quarter != null) params.set(PARAM.dateQuarter, String(filters.date.quarter));
    if (filters.date.month != null) params.set(PARAM.dateMonth, String(filters.date.month));
    if (filters.date.from) params.set(PARAM.dateFrom, filters.date.from);
    if (filters.date.to) params.set(PARAM.dateTo, filters.date.to);
  }

  // Source filter
  if (filters.source !== "all") params.set(PARAM.source, filters.source);

  // Vendor
  if (filters.vendor) params.set(PARAM.vendor, filters.vendor);

  // Category
  if (filters.category) params.set(PARAM.category, filters.category);

  // Sorting
  if (sorting) {
    params.set(PARAM.sort, sorting.column);
    params.set(PARAM.direction, sorting.direction);
  }

  return params;
}

export function searchParamsToFilters(params: URLSearchParams): {
  filters: UnifiedFilters;
  sorting: UnifiedSorting | undefined;
} {
  const mode = (params.get(PARAM.dateMode) as DateFilterMode) || "all";
  const year = params.get(PARAM.dateYear) ? Number(params.get(PARAM.dateYear)) : undefined;
  const quarter = params.get(PARAM.dateQuarter) ? Number(params.get(PARAM.dateQuarter)) : undefined;
  const month = params.get(PARAM.dateMonth) ? Number(params.get(PARAM.dateMonth)) : undefined;
  const from = params.get(PARAM.dateFrom) || undefined;
  const to = params.get(PARAM.dateTo) || undefined;

  const source = (params.get(PARAM.source) as RecordSource) || "all";

  const filters: UnifiedFilters = {
    date: { mode, year, quarter, month, from, to },
    source,
    vendor: params.get(PARAM.vendor) || undefined,
    category: params.get(PARAM.category) || undefined,
  };

  const sortCol = params.get(PARAM.sort);
  const sortDir = params.get(PARAM.direction) as "asc" | "desc" | null;
  const sorting = sortCol ? { column: sortCol, direction: sortDir || "asc" } : undefined;

  return { filters, sorting };
}

export function hasActiveFilters(filters: UnifiedFilters): boolean {
  return filters.date.mode !== "all" || filters.source !== "all" || !!filters.vendor || !!filters.category;
}
