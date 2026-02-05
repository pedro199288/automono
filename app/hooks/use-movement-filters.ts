import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import {
  filterMovements,
  sortMovements,
  type MovementFilters,
  type MovementSorting,
} from "~/lib/movement-filters";
import {
  filtersToSearchParams,
  searchParamsToFilters,
} from "~/lib/movement-search-params";
import type { MovementWithVendor } from "~/lib/types";

export function useMovementFilters(allMovements: MovementWithVendor[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { filters, sorting } = useMemo(
    () => searchParamsToFilters(searchParams),
    [searchParams]
  );

  const setFilters = useCallback(
    (newFilters: MovementFilters) => {
      const params = filtersToSearchParams(newFilters, sorting);
      setSearchParams(params, { replace: true });
    },
    [sorting, setSearchParams]
  );

  const setSorting = useCallback(
    (newSorting: MovementSorting | undefined) => {
      const params = filtersToSearchParams(filters, newSorting);
      setSearchParams(params, { replace: true });
    },
    [filters, setSearchParams]
  );

  const filteredMovements = useMemo(() => {
    const filtered = filterMovements(allMovements, filters);
    return sortMovements(filtered, sorting);
  }, [allMovements, filters, sorting]);

  return {
    filters,
    sorting,
    setFilters,
    setSorting,
    filteredMovements,
    totalCount: allMovements.length,
    filteredCount: filteredMovements.length,
  };
}
