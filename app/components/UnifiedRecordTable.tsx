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
import { Badge } from "./ui/badge";
import { Link } from "react-router";
import { ChevronUp, ChevronDown, FileText, Wallet } from "lucide-react";
import { formatCurrency } from "~/lib/utils";
import { getCategoryLabel, categoryColors } from "~/lib/movement-categories";
import type { UnifiedRecord } from "~/lib/unified-types";

interface UnifiedRecordTableProps {
  records: UnifiedRecord[];
  type: "gastos" | "ingresos";
}

export function UnifiedRecordTable({ records, type }: UnifiedRecordTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const lastClickedIndex = useRef<number>(-1);

  const columns = useMemo<ColumnDef<UnifiedRecord>[]>(
    () => [
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
        accessorKey: "source",
        header: "Fuente",
        cell: ({ row }) => {
          const isInvoice = row.original.source === "invoice";
          return (
            <Badge
              variant="outline"
              className={
                isInvoice
                  ? "border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300"
                  : "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
              }
            >
              {isInvoice ? (
                <><FileText className="h-3 w-3 mr-1" />Factura</>
              ) : (
                <><Wallet className="h-3 w-3 mr-1" />Movimiento</>
              )}
            </Badge>
          );
        },
      },
      {
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => row.original.date || <span className="text-zinc-300">&mdash;</span>,
      },
      {
        accessorKey: "description",
        header: "Descripcion",
        cell: ({ row }) => {
          const rec = row.original;
          const href = rec.source === "invoice"
            ? `/invoices/${type}/${rec.id.replace("inv-", "")}`
            : `/movements/${type}/${rec.id.replace("mov-", "")}`;
          return (
            <Link
              to={href}
              className="text-blue-600 hover:underline dark:text-blue-400 max-w-[300px] truncate block"
            >
              {rec.description}
            </Link>
          );
        },
      },
      {
        accessorKey: "vendorName",
        header: type === "ingresos" ? "Cliente" : "Proveedor",
        cell: ({ row }) => row.original.vendorName || <span className="text-zinc-300">&mdash;</span>,
      },
      ...(type === "gastos"
        ? [
            {
              accessorKey: "category",
              header: "Categoria",
              cell: ({ row }: { row: { original: UnifiedRecord } }) => {
                const cat = row.original.category;
                if (!cat) return <span className="text-zinc-300">&mdash;</span>;
                const colorClass = categoryColors[cat] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
                return <Badge className={colorClass}>{getCategoryLabel(cat)}</Badge>;
              },
            } as ColumnDef<UnifiedRecord>,
          ]
        : []),
      {
        accessorKey: "amount",
        header: "Importe",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: "taxBase",
        header: "Base Imp.",
        cell: ({ row }) =>
          row.original.taxBase != null
            ? formatCurrency(row.original.taxBase)
            : <span className="text-zinc-300">&mdash;</span>,
      },
      {
        accessorKey: "trimestre",
        header: "Trimestre",
        cell: ({ row }) => <Badge variant="secondary">{row.original.trimestre}</Badge>,
      },
    ],
    [type]
  );

  const table = useReactTable({
    data: records,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  });

  const handleRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, rowIndex: number) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, label, select") || target.closest("input:not([type=checkbox])")) return;

      const rows = table.getRowModel().rows;
      const row = rows[rowIndex];
      if (!row) return;

      if (e.shiftKey && lastClickedIndex.current >= 0) {
        const start = Math.min(lastClickedIndex.current, rowIndex);
        const end = Math.max(lastClickedIndex.current, rowIndex);
        const newSelection = { ...rowSelection };
        for (let i = start; i <= end; i++) {
          const r = rows[i];
          if (r) newSelection[r.id] = true;
        }
        setRowSelection(newSelection);
      } else if (e.metaKey || e.ctrlKey) {
        const newSelection = { ...rowSelection };
        if (newSelection[row.id]) {
          delete newSelection[row.id];
        } else {
          newSelection[row.id] = true;
        }
        setRowSelection(newSelection);
        lastClickedIndex.current = rowIndex;
      } else {
        row.toggleSelected(!row.getIsSelected());
        lastClickedIndex.current = rowIndex;
      }
    },
    [table, rowSelection]
  );

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary">{selectedCount} seleccionados</Badge>
        </div>
      )}

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
            {records.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-zinc-400">
                  No hay registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
