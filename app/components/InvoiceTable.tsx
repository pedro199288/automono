import { useState, useMemo, useRef, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { Button } from "./ui/button";
import { CopyButton } from "./CopyButton";
import { ProcessButton } from "./ProcessButton";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Select } from "./ui/select";
import { VendorCombobox } from "./VendorCombobox";
import { CategoriaSelect, categoriaColors } from "./CategoriaSelect";
import { Pencil, Save, X, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { parseDDMMYYYY } from "~/lib/invoice-filters";
import { formatCurrency, isMonetaryField, DEFAULT_CURRENCY, CURRENCY_OPTIONS } from "~/lib/utils";
import { useVendors, useCreateVendor, useAssignVendor } from "~/hooks/use-invoices";
import type { InvoiceWithVendor } from "~/lib/types";

interface InvoiceTableProps {
  invoices: InvoiceWithVendor[];
  folderType: string;
  onUpdate: (id: number, data: string) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  searchString?: string;
}

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "secondary",
  processed: "success",
  warning: "warning",
  error: "destructive",
};

const gastoFields = ["fecha", "numero_factura", "proveedor", "concepto", "base_imponible", "tipo_iva", "iva", "total", "currency", "categoria"];
const ingresoFields = ["fecha_factura", "numero_factura", "cliente", "proyecto", "descripcion", "base_imponible", "tipo_iva", "iva", "total_factura", "irpf", "currency"];

const gastosHeaderLabels: Record<string, string> = {
  fecha: "Fecha",
  numero_factura: "Nº Factura",
  proveedor: "Proveedor",
  concepto: "Concepto",
  base_imponible: "Base Imp.",
  tipo_iva: "IVA %",
  iva: "IVA",
  total: "Total",
  currency: "Moneda",
  categoria: "Categoría",
};

const ingresosHeaderLabels: Record<string, string> = {
  fecha_factura: "Fecha",
  numero_factura: "Nº Factura",
  cliente: "Cliente",
  proyecto: "Proyecto",
  descripcion: "Descripción",
  base_imponible: "Base Imp.",
  tipo_iva: "IVA %",
  iva: "IVA",
  total_factura: "Total",
  irpf: "IRPF",
  currency: "Moneda",
};

const dateFields = new Set(["fecha", "fecha_factura"]);

type EditDataMap = Record<number, Record<string, unknown>>;

export function InvoiceTable({ invoices, folderType, onUpdate, sorting: externalSorting, onSortingChange, searchString = "" }: InvoiceTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDataMap, setEditDataMap] = useState<EditDataMap>({});
  const lastClickedIndex = useRef<number>(-1);

  const { data: vendorsData } = useVendors();
  const createVendor = useCreateVendor();
  const assignVendor = useAssignVendor();

  const sorting = externalSorting ?? internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;

  const fields = folderType === "gastos" ? gastoFields : ingresoFields;
  const headerLabels = folderType === "gastos" ? gastosHeaderLabels : ingresosHeaderLabels;
  const vendorFieldName = folderType === "gastos" ? "proveedor" : "cliente";

  const startEditMode = () => {
    const initialData: EditDataMap = {};
    for (const invoice of invoices) {
      if (invoice.extracted_data) {
        initialData[invoice.id] = JSON.parse(invoice.extracted_data);
      }
    }
    setEditDataMap(initialData);
    setIsEditMode(true);
  };

  const cancelEditMode = () => {
    setIsEditMode(false);
    setEditDataMap({});
  };

  const saveAllEdits = () => {
    for (const invoice of invoices) {
      const editData = editDataMap[invoice.id];
      if (!editData) continue;

      const originalData = invoice.extracted_data ? JSON.parse(invoice.extracted_data) : {};
      const dataToSave: Record<string, unknown> = {};
      let hasChanges = false;

      for (const [key, value] of Object.entries(editData)) {
        if (key === vendorFieldName) continue; // Vendor se maneja por separado
        if (value === null || value === "") {
          dataToSave[key] = null;
        } else {
          const str = String(value);
          dataToSave[key] = isNaN(Number(str)) ? str : Number(str);
        }
        // Check if value changed
        if (JSON.stringify(dataToSave[key]) !== JSON.stringify(originalData[key])) {
          hasChanges = true;
        }
      }

      if (hasChanges) {
        onUpdate(invoice.id, JSON.stringify(dataToSave));
      }
    }
    setIsEditMode(false);
    setEditDataMap({});
  };

  const updateField = (invoiceId: number, field: string, value: string) => {
    setEditDataMap((prev) => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        [field]: value === "" ? null : value,
      },
    }));
  };

  const columns = useMemo<ColumnDef<InvoiceWithVendor>[]>(() => {
    const cols: ColumnDef<InvoiceWithVendor>[] = [
      {
        id: "select",
        header: ({ table: t }) => (
          <input
            type="checkbox"
            checked={t.getIsAllRowsSelected()}
            onChange={t.getToggleAllRowsSelectedHandler()}
            className="h-4 w-4 rounded border-zinc-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            readOnly
            className="h-4 w-4 rounded border-zinc-300 pointer-events-none"
          />
        ),
        enableSorting: false,
      },
      {
        id: "status",
        header: "Estado",
        enableSorting: false,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
            <div>
              <Badge variant={statusVariant[invoice.status] || "secondary"}>
                {invoice.status}
              </Badge>
              {invoice.warning_message && (
                <p className="mt-1 text-xs text-yellow-600">{invoice.warning_message}</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "file_name",
        header: "Archivo",
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.file_name;
          const b = rowB.original.file_name;
          return a.localeCompare(b);
        },
        cell: ({ row }) => {
          const invoice = row.original;
          const display = `${invoice.subfolder ? `${invoice.subfolder}/` : ""}${invoice.file_name}`;
          return (
            <Link
              to={`/invoices/${invoice.folder_type}/${invoice.id}${searchString}`}
              className="font-mono text-xs max-w-[200px] truncate block text-blue-600 hover:underline dark:text-blue-400"
              title={invoice.file_name}
              onClick={(e) => e.stopPropagation()}
            >
              {display}
            </Link>
          );
        },
      },
    ];

    for (const field of fields) {
      const isDate = dateFields.has(field);
      cols.push({
        id: field,
        header: headerLabels[field] || field,
        accessorFn: (row) => {
          const parsed = row.extracted_data ? JSON.parse(row.extracted_data) : null;
          return parsed ? parsed[field] : null;
        },
        sortingFn: isDate
          ? (rowA, rowB, columnId) => {
              const a = rowA.getValue<string | null>(columnId);
              const b = rowB.getValue<string | null>(columnId);
              const da = parseDDMMYYYY(a);
              const db = parseDDMMYYYY(b);
              if (!da && !db) return 0;
              if (!da) return -1;
              if (!db) return 1;
              return da.getTime() - db.getTime();
            }
          : undefined,
        cell: ({ row }) => {
          const invoice = row.original;
          const parsed = invoice.extracted_data ? JSON.parse(invoice.extracted_data) : null;
          const editData = editDataMap[invoice.id];
          const isVendorField = (invoice.folder_type === "gastos" && field === "proveedor") ||
            (invoice.folder_type === "ingresos" && field === "cliente");

          if (!parsed) return <span className="text-zinc-300">&mdash;</span>;

          if (isEditMode && editData) {
            // Campo vendor (proveedor/cliente)
            if (isVendorField) {
              return (
                <VendorCombobox
                  vendors={vendorsData?.vendors ?? []}
                  value={invoice.vendor_id}
                  onSelect={(vendorId) => assignVendor.mutate({ invoiceId: invoice.id, vendorId })}
                  onCreate={(rawName) => {
                    createVendor.mutate({ raw_name: rawName }, {
                      onSuccess: (data) => {
                        assignVendor.mutate({ invoiceId: invoice.id, vendorId: data.vendor.id });
                      },
                    });
                  }}
                  onClear={() => assignVendor.mutate({ invoiceId: invoice.id, vendorId: null, vendorField: vendorFieldName })}
                  disabled={assignVendor.isPending || createVendor.isPending}
                  placeholder={`Seleccionar ${folderType === "gastos" ? "proveedor" : "cliente"}...`}
                  entityLabel={folderType === "gastos" ? "proveedor" : "cliente"}
                />
              );
            }

            // Campo categoría (solo gastos)
            if (field === "categoria" && folderType === "gastos") {
              return (
                <CategoriaSelect
                  value={editData[field] != null ? String(editData[field]) : null}
                  onChange={(val) => updateField(invoice.id, field, val ?? "")}
                />
              );
            }

            // Campo currency
            if (field === "currency") {
              return (
                <Select
                  className="h-8 min-w-[70px] py-1 px-2 text-xs"
                  value={editData[field] != null ? String(editData[field]) : DEFAULT_CURRENCY}
                  onChange={(e) => updateField(invoice.id, field, e.target.value)}
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </Select>
              );
            }

            // Resto de campos: Input normal
            return (
              <Input
                className="h-8 min-w-[80px] py-1 px-2 text-xs"
                value={editData[field] != null ? String(editData[field]) : ""}
                onChange={(e) => updateField(invoice.id, field, e.target.value)}
              />
            );
          }

          if (isVendorField && invoice.vendor_name) {
            return invoice.vendor_name;
          }

          const value = parsed[field];
          if (value === null || value === undefined) return <span className="text-zinc-300">&mdash;</span>;
          if (field === "categoria") {
            const colorClass = categoriaColors[String(value)] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
            return <Badge className={colorClass}>{String(value)}</Badge>;
          }
          if (isMonetaryField(field, folderType)) {
            return formatCurrency(value, parsed.currency ?? DEFAULT_CURRENCY) ?? String(value);
          }
          return String(value);
        },
      });
    }

    return cols;
  }, [folderType, isEditMode, editDataMap, fields, headerLabels, searchString, vendorsData, assignVendor, createVendor, vendorFieldName]);

  const table = useReactTable({
    data: invoices,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
    },
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
  });

  const selectedInvoices = table.getSelectedRowModel().rows.map((r) => r.original);
  const reprocessable = (i: InvoiceWithVendor) => i.raw_text != null;
  const reprocessableSelected = selectedInvoices.filter(reprocessable);

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, rowIndex: number) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, label, select") || target.closest("input:not([type=checkbox])")) return;

      const rows = table.getRowModel().rows;
      const row = rows[rowIndex];
      if (!row) return;

      if (e.shiftKey && lastClickedIndex.current >= 0) {
        // Shift+click: range selection
        const start = Math.min(lastClickedIndex.current, rowIndex);
        const end = Math.max(lastClickedIndex.current, rowIndex);
        const newSelection = { ...rowSelection };
        for (let i = start; i <= end; i++) {
          const r = rows[i];
          if (r) newSelection[r.id] = true;
        }
        setRowSelection(newSelection);
      } else if (e.metaKey || e.ctrlKey) {
        // Cmd/Ctrl+click: toggle additive
        const newSelection = { ...rowSelection };
        if (newSelection[row.id]) {
          delete newSelection[row.id];
        } else {
          newSelection[row.id] = true;
        }
        setRowSelection(newSelection);
        lastClickedIndex.current = rowIndex;
      } else {
        // Normal click: toggle single
        row.toggleSelected(!row.getIsSelected());
        lastClickedIndex.current = rowIndex;
      }
    },
    [table, rowSelection]
  );

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center gap-2 shrink-0">
        {isEditMode ? (
          <>
            <Button onClick={saveAllEdits} size="sm">
              <Save className="h-4 w-4 mr-1" />
              Guardar cambios
            </Button>
            <Button onClick={cancelEditMode} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button onClick={startEditMode} variant="outline" size="sm" disabled={invoices.length === 0}>
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <CopyButton
              invoices={selectedInvoices}
              disabled={selectedInvoices.length === 0}
            />
            {reprocessableSelected.length > 0 && (
              <ProcessButton
                invoiceIds={reprocessableSelected.map((i) => i.id)}
                label={`Reprocesar seleccionadas (${reprocessableSelected.length})`}
                disabled={false}
              />
            )}
            {selectedInvoices.length > 0 && (
              <Badge variant="secondary">{selectedInvoices.length} seleccionadas</Badge>
            )}
          </>
        )}
      </div>

      <div className="overflow-auto flex-1 min-h-0 rounded-md border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-zinc-50 dark:bg-zinc-900">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={`px-3 py-2 text-left font-medium text-zinc-500 ${canSort ? "cursor-pointer select-none hover:text-zinc-700 dark:hover:text-zinc-300" : ""}`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && sorted === "asc" && <ChevronUp className="h-3 w-3" />}
                        {canSort && sorted === "desc" && <ChevronDown className="h-3 w-3" />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={`border-b transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer ${
                  row.getIsSelected() ? "bg-blue-50 dark:bg-blue-950" : ""
                }`}
                onClick={(e) => handleRowClick(e, index)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-zinc-400">
                  No hay facturas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
