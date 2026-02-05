import { Link, useParams } from "react-router";
import { X, Users, Tag } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FilterCombobox } from "~/components/FilterCombobox";
import { DateFilterPopover } from "~/components/DateFilterPopover";
import { hasActiveFilters } from "~/lib/movement-search-params";
import {
  getAvailableYears,
  getAvailableCategories,
  type MovementFilters,
} from "~/lib/movement-filters";
import { getCategoryLabel } from "~/lib/movement-categories";
import type { MovementWithVendor } from "~/lib/types";

interface MovementFilterBarProps {
  filters: MovementFilters;
  onFiltersChange: (filters: MovementFilters) => void;
  allMovements: MovementWithVendor[];
  filteredCount: number;
  totalCount: number;
}

export function MovementFilterBar({
  filters,
  onFiltersChange,
  allMovements,
  filteredCount,
  totalCount,
}: MovementFilterBarProps) {
  const { type } = useParams();

  const availableYears = getAvailableYears(allMovements);
  const availableCategories = getAvailableCategories(allMovements);

  // Build vendor options from movements
  const vendorMap = new Map<string, string>();
  for (const mov of allMovements) {
    if (mov.vendor_id) {
      const label = mov.vendor_name || mov.vendor_id;
      vendorMap.set(mov.vendor_id, label);
    }
  }
  const vendorOptions = Array.from(vendorMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const categoryOptions = availableCategories.map((c) => ({
    value: c,
    label: getCategoryLabel(c)
  }));

  const active = hasActiveFilters(filters);

  const clearFilters = () => {
    onFiltersChange({ date: { mode: "all" } });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Type tabs */}
      <div className="flex gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-3">
        <Link to="/movements/gastos" replace>
          <Button
            variant={type === "gastos" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs"
          >
            Gastos
          </Button>
        </Link>
        <Link to="/movements/ingresos" replace>
          <Button
            variant={type === "ingresos" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs"
          >
            Ingresos
          </Button>
        </Link>
      </div>

      {/* Date filter */}
      <DateFilterPopover
        value={filters.date}
        onChange={(date) => onFiltersChange({ ...filters, date })}
        availableYears={availableYears}
      />

      {/* Vendor filter */}
      <FilterCombobox
        options={vendorOptions}
        value={filters.vendor}
        onChange={(vendor) => onFiltersChange({ ...filters, vendor })}
        placeholder="Entidad"
        searchPlaceholder="Buscar entidad..."
        icon={Users}
      />

      {/* Category filter */}
      <FilterCombobox
        options={categoryOptions}
        value={filters.category}
        onChange={(category) => onFiltersChange({ ...filters, category })}
        placeholder="Categoria"
        searchPlaceholder="Buscar categoria..."
        icon={Tag}
      />

      {/* Clear */}
      {active && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
          <X className="mr-1 h-3 w-3" />
          Limpiar filtros
        </Button>
      )}

      {/* Count badge */}
      <div className="ml-auto">
        <Badge variant="secondary" className="text-xs">
          {filteredCount === totalCount
            ? `${totalCount} movimientos`
            : `${filteredCount} de ${totalCount} movimientos`}
        </Badge>
      </div>
    </div>
  );
}
