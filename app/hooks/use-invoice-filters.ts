import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router";
import {
  filterInvoices,
  sortInvoices,
  type InvoiceFilters,
  type InvoiceSorting,
} from "~/lib/invoice-filters";
import {
  filtersToSearchParams,
  searchParamsToFilters,
} from "~/lib/invoice-search-params";
import type { InvoiceWithVendor } from "~/lib/types";

export function useInvoiceFilters(allInvoices: InvoiceWithVendor[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { filters, sorting } = useMemo(
    () => searchParamsToFilters(searchParams),
    [searchParams]
  );

  const setFilters = useCallback(
    (newFilters: InvoiceFilters) => {
      const params = filtersToSearchParams(newFilters, sorting);
      setSearchParams(params, { replace: true });
    },
    [sorting, setSearchParams]
  );

  const setSorting = useCallback(
    (newSorting: InvoiceSorting | undefined) => {
      const params = filtersToSearchParams(filters, newSorting);
      setSearchParams(params, { replace: true });
    },
    [filters, setSearchParams]
  );

  const filteredInvoices = useMemo(() => {
    const filtered = filterInvoices(allInvoices, filters);
    return sortInvoices(filtered, sorting);
  }, [allInvoices, filters, sorting]);

  return {
    filters,
    sorting,
    setFilters,
    setSorting,
    filteredInvoices,
    totalCount: allInvoices.length,
    filteredCount: filteredInvoices.length,
  };
}
