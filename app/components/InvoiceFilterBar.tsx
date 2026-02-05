import { Link, useParams } from "react-router";
import { X, Users, Tag } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FilterCombobox } from "~/components/FilterCombobox";
import { DateFilterPopover } from "~/components/DateFilterPopover";
import { hasActiveFilters } from "~/lib/invoice-search-params";
import {
  getAvailableYears,
  getAvailableCategories,
  type InvoiceFilters,
} from "~/lib/invoice-filters";
import type { InvoiceWithVendor } from "~/lib/types";

interface InvoiceFilterBarProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  allInvoices: InvoiceWithVendor[];
  filteredCount: number;
  totalCount: number;
}

export function InvoiceFilterBar({
  filters,
  onFiltersChange,
  allInvoices,
  filteredCount,
  totalCount,
}: InvoiceFilterBarProps) {
  const { type } = useParams();

  const availableYears = getAvailableYears(allInvoices);
  const availableCategories = getAvailableCategories(allInvoices);

  // Build vendor options from invoices
  const vendorMap = new Map<string, string>();
  for (const inv of allInvoices) {
    if (inv.vendor_id) {
      const label = inv.vendor_name || inv.vendor_id;
      vendorMap.set(inv.vendor_id, label);
    }
  }
  const vendorOptions = Array.from(vendorMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const categoryOptions = availableCategories.map((c) => ({ value: c, label: c }));

  const active = hasActiveFilters(filters);

  const clearFilters = () => {
    onFiltersChange({ date: { mode: "all" } });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Type tabs */}
      <div className="flex gap-1 border-r border-zinc-200 dark:border-zinc-800 pr-3">
        <Link to="/invoices/gastos" replace>
          <Button
            variant={type === "gastos" ? "default" : "ghost"}
            size="sm"
            className="h-8 text-xs"
          >
            Gastos
          </Button>
        </Link>
        <Link to="/invoices/ingresos" replace>
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
          placeholder="Categoría"
          searchPlaceholder="Buscar categoría..."
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
            ? `${totalCount} facturas`
            : `${filteredCount} de ${totalCount} facturas`}
        </Badge>
      </div>
    </div>
  );
}
