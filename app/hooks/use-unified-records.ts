import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/lib/api";
import {
  filterRecords,
  sortRecords,
  type UnifiedFilters,
  type UnifiedSorting,
} from "~/lib/unified-filters";
import {
  filtersToSearchParams,
  searchParamsToFilters,
} from "~/lib/unified-search-params";
import type { UnifiedRecord } from "~/lib/unified-types";

interface UnifiedRecordsResponse {
  records: UnifiedRecord[];
  stats: {
    invoiceCount: number;
    movementCount: number;
    totalAmount: number;
  };
}

export function useUnifiedRecords(type: "gastos" | "ingresos") {
  return useQuery({
    queryKey: ["unified-records", type],
    queryFn: () => api.get<UnifiedRecordsResponse>(`/records/${type}`),
  });
}

export function useUnifiedFilters(allRecords: UnifiedRecord[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { filters, sorting } = useMemo(
    () => searchParamsToFilters(searchParams),
    [searchParams]
  );

  const setFilters = useCallback(
    (newFilters: UnifiedFilters) => {
      const params = filtersToSearchParams(newFilters, sorting);
      setSearchParams(params, { replace: true });
    },
    [sorting, setSearchParams]
  );

  const setSorting = useCallback(
    (newSorting: UnifiedSorting | undefined) => {
      const params = filtersToSearchParams(filters, newSorting);
      setSearchParams(params, { replace: true });
    },
    [filters, setSearchParams]
  );

  const filteredRecords = useMemo(() => {
    const filtered = filterRecords(allRecords, filters);
    return sortRecords(filtered, sorting);
  }, [allRecords, filters, sorting]);

  return {
    filters,
    sorting,
    setFilters,
    setSorting,
    filteredRecords,
    totalCount: allRecords.length,
    filteredCount: filteredRecords.length,
  };
}
