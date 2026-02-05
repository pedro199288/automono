import { useParams } from "react-router";
import { useUnifiedRecords, useUnifiedFilters } from "~/hooks/use-unified-records";
import { UnifiedRecordTable } from "~/components/UnifiedRecordTable";
import { UnifiedFilterBar } from "~/components/UnifiedFilterBar";

export default function RecordsType() {
  const { type } = useParams();
  const recordType = type as "gastos" | "ingresos";

  const { data, isLoading, error } = useUnifiedRecords(recordType);
  const allRecords = data?.records ?? [];

  const {
    filters,
    setFilters,
    filteredRecords,
    totalCount,
    filteredCount,
  } = useUnifiedFilters(allRecords);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {recordType === "ingresos" ? "Ingresos" : "Gastos"} - Vista Unificada
        </h2>
      </div>

      <UnifiedFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        allRecords={allRecords}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />

      {isLoading && <p className="text-zinc-400">Cargando registros...</p>}
      {error && <p className="text-red-500">Error: {(error as Error).message}</p>}

      {data && <UnifiedRecordTable records={filteredRecords} type={recordType} />}
    </div>
  );
}
