import { useParams } from "react-router";
import { useMovements } from "~/hooks/use-movements";
import { useMovementFilters } from "~/hooks/use-movement-filters";
import { MovementTable } from "~/components/MovementTable";
import { MovementFilterBar } from "~/components/MovementFilterBar";

export default function MovementsType() {
  const { type } = useParams();
  const movementType = type as "ingresos" | "gastos";

  const { data, isLoading, error } = useMovements(movementType);
  const allMovements = data?.movements ?? [];

  const {
    filters,
    setFilters,
    filteredMovements,
    totalCount,
    filteredCount,
  } = useMovementFilters(allMovements);

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {movementType === "ingresos" ? "Ingresos" : "Gastos"} (No factura)
        </h2>
      </div>

      <MovementFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        allMovements={allMovements}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />

      {isLoading && <p className="text-zinc-400">Cargando movimientos...</p>}
      {error && <p className="text-red-500">Error: {(error as Error).message}</p>}

      {data && <MovementTable movements={filteredMovements} type={movementType} />}
    </div>
  );
}
