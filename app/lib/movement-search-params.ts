import type { DateFilterMode, MovementFilters, MovementSorting } from "./movement-filters";

// Short param keys
const PARAM = {
  dateMode: "dm",
  dateYear: "dy",
  dateQuarter: "dq",
  dateMonth: "dmo",
  dateFrom: "df",
  dateTo: "dt",
  vendor: "vendor",
  category: "cat",
  sort: "sort",
  direction: "dir",
} as const;

export function filtersToSearchParams(filters: MovementFilters, sorting?: MovementSorting): URLSearchParams {
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
  filters: MovementFilters;
  sorting: MovementSorting | undefined;
} {
  const mode = (params.get(PARAM.dateMode) as DateFilterMode) || "all";
  const year = params.get(PARAM.dateYear) ? Number(params.get(PARAM.dateYear)) : undefined;
  const quarter = params.get(PARAM.dateQuarter) ? Number(params.get(PARAM.dateQuarter)) : undefined;
  const month = params.get(PARAM.dateMonth) ? Number(params.get(PARAM.dateMonth)) : undefined;
  const from = params.get(PARAM.dateFrom) || undefined;
  const to = params.get(PARAM.dateTo) || undefined;

  const filters: MovementFilters = {
    date: { mode, year, quarter, month, from, to },
    vendor: params.get(PARAM.vendor) || undefined,
    category: params.get(PARAM.category) || undefined,
  };

  const sortCol = params.get(PARAM.sort);
  const sortDir = params.get(PARAM.direction) as "asc" | "desc" | null;
  const sorting = sortCol ? { column: sortCol, direction: sortDir || "asc" } : undefined;

  return { filters, sorting };
}

export function hasActiveFilters(filters: MovementFilters): boolean {
  return filters.date.mode !== "all" || !!filters.vendor || !!filters.category;
}
