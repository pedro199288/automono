import { useParams, useSearchParams } from "react-router";
import { useInvoicesByType, useUpdateInvoice } from "~/hooks/use-invoices";
import { useInvoiceFilters } from "~/hooks/use-invoice-filters";
import { InvoiceTable } from "~/components/InvoiceTable";
import { InvoiceFilterBar } from "~/components/InvoiceFilterBar";
import { ProcessButton } from "~/components/ProcessButton";
import { Badge } from "~/components/ui/badge";
import type { SortingState } from "@tanstack/react-table";

export default function InvoicesType() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const searchString = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  const folderType = type as "gastos" | "ingresos";

  const { data, isLoading, error } = useInvoicesByType(folderType);
  const updateInvoice = useUpdateInvoice();

  const allInvoices = data?.invoices ?? [];
  const {
    filters,
    sorting,
    setFilters,
    setSorting,
    filteredInvoices,
    totalCount,
    filteredCount,
  } = useInvoiceFilters(allInvoices);

  const handleUpdate = (id: number, extractedData: string) => {
    updateInvoice.mutate({ id, extracted_data: extractedData });
  };

  // Default sort by date ascending
  const dateColumn = folderType === "gastos" ? "fecha" : "fecha_factura";
  const effectiveSorting = sorting ?? { column: dateColumn, direction: "asc" as const };

  // Convert our sorting to TanStack format
  const tableSorting: SortingState = [
    { id: effectiveSorting.column, desc: effectiveSorting.direction === "desc" },
  ];

  // Counts for pending/unprocessed invoices
  const pendingInvoices = allInvoices.filter((inv) => inv.status === "pending");
  const unprocessedCount = allInvoices.filter((inv) => inv.status !== "processed").length;

  const handleSortingChange = (newSorting: SortingState) => {
    if (newSorting.length === 0) {
      setSorting(undefined);
    } else {
      setSorting({
        column: newSorting[0].id,
        direction: newSorting[0].desc ? "desc" : "asc",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <InvoiceFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        allInvoices={allInvoices}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />

      {unprocessedCount > 0 && (
        <div className="flex items-center gap-3">
          <Badge variant="warning" className="text-xs">
            {unprocessedCount} sin procesar
          </Badge>
          {pendingInvoices.length > 0 && (
            <ProcessButton
              invoiceIds={pendingInvoices.map((inv) => inv.id)}
              label={`Procesar pendientes (${pendingInvoices.length})`}
              showProgressBar
            />
          )}
        </div>
      )}

      {isLoading && <p className="text-zinc-400">Cargando facturas...</p>}
      {error && <p className="text-red-500">Error: {(error as Error).message}</p>}

      {data && (
        <InvoiceTable
          invoices={filteredInvoices}
          folderType={folderType}
          onUpdate={handleUpdate}
          sorting={tableSorting}
          onSortingChange={handleSortingChange}
          searchString={searchString}
        />
      )}
    </div>
  );
}
