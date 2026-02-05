import { Link, useParams } from "react-router";
import { X, Users, Tag, FileText, Wallet } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FilterCombobox } from "~/components/FilterCombobox";
import { DateFilterPopover } from "~/components/DateFilterPopover";
import { hasActiveFilters } from "~/lib/unified-search-params";
import {
  getAvailableYears,
  getAvailableCategories,
  type UnifiedFilters,
} from "~/lib/unified-filters";
import { getCategoryLabel } from "~/lib/movement-categories";
import type { UnifiedRecord, RecordSource } from "~/lib/unified-types";

interface UnifiedFilterBarProps {
  filters: UnifiedFilters;
  onFiltersChange: (filters: UnifiedFilters) => void;
  allRecords: UnifiedRecord[];
  filteredCount: number;
  totalCount: number;
}

const sourceOptions: { value: RecordSource; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "invoice", label: "Facturas" },
  { value: "movement", label: "Movimientos" },
];

export function UnifiedFilterBar({
  filters,
  onFiltersChange,
  allRecords,
  filteredCount,
  totalCount,
}: UnifiedFilterBarProps) {
  const { type } = useParams();

  const availableYears = getAvailableYears(allRecords);
  const availableCategories = getAvailableCategories(allRecords);

  // Build vendor options from records
  const vendorMap = new Map<string, string>();
  for (const rec of allRecords) {
    if (rec.vendorId) {
      const label = rec.vendorName || rec.vendorId;
      vendorMap.set(rec.vendorId, label);
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
    onFiltersChange({ date: { mode: "all" }, source: "all" });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Type tabs */}
      <div className="flex gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-3">
        <Link to="/records/gastos" replace>
          <Button
            variant={type === "gastos" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs"
          >
            Gastos
          </Button>
        </Link>
        <Link to="/records/ingresos" replace>
          <Button
            variant={type === "ingresos" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs"
          >
            Ingresos
          </Button>
        </Link>
      </div>

      {/* Source filter */}
      <div className="flex gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-3">
        {sourceOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={filters.source === opt.value ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => onFiltersChange({ ...filters, source: opt.value })}
          >
            {opt.value === "invoice" && <FileText className="h-3 w-3 mr-1" />}
            {opt.value === "movement" && <Wallet className="h-3 w-3 mr-1" />}
            {opt.label}
          </Button>
        ))}
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
        placeholder={type === "ingresos" ? "Cliente" : "Proveedor"}
        searchPlaceholder={type === "ingresos" ? "Buscar cliente..." : "Buscar proveedor..."}
        icon={Users}
      />

      {/* Category filter (gastos only) */}
      {type === "gastos" && (
        <FilterCombobox
          options={categoryOptions}
          value={filters.category}
          onChange={(category) => onFiltersChange({ ...filters, category })}
          placeholder="Categoria"
          searchPlaceholder="Buscar categoria..."
          icon={Tag}
        />
      )}

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
            ? `${totalCount} registros`
            : `${filteredCount} de ${totalCount} registros`}
        </Badge>
      </div>
    </div>
  );
}
