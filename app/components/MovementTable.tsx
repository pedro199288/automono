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
import { Badge } from "./ui/badge";
import { Link } from "react-router";
import { ChevronUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { formatCurrency, DEFAULT_CURRENCY } from "~/lib/utils";
import { getCategoryLabel, categoryColors } from "~/lib/movement-categories";
import { useDeleteMovement } from "~/hooks/use-movements";
import type { MovementWithVendor } from "~/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface MovementTableProps {
  movements: MovementWithVendor[];
  type: "ingresos" | "gastos";
}

export function MovementTable({ movements, type }: MovementTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const lastClickedIndex = useRef<number>(-1);

  const deleteMovement = useDeleteMovement();

  const columns = useMemo<ColumnDef<MovementWithVendor>[]>(
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
        accessorKey: "date",
        header: "Fecha",
        cell: ({ row }) => row.original.date,
      },
      {
        accessorKey: "category",
        header: "Categoria",
        cell: ({ row }) => {
          const cat = row.original.category;
          const colorClass = categoryColors[cat] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
          return <Badge className={colorClass}>{getCategoryLabel(cat)}</Badge>;
        },
      },
      {
        accessorKey: "description",
        header: "Descripcion",
        cell: ({ row }) => (
          <Link
            to={`/movements/${type}/${row.original.id}`}
            className="text-blue-600 hover:underline dark:text-blue-400 max-w-[300px] truncate block"
          >
            {row.original.description}
          </Link>
        ),
      },
      {
        accessorKey: "vendor_name",
        header: "Entidad",
        cell: ({ row }) => row.original.vendor_name || <span className="text-zinc-300">&mdash;</span>,
      },
      {
        accessorKey: "amount",
        header: "Importe",
        cell: ({ row }) => formatCurrency(row.original.amount, row.original.currency ?? DEFAULT_CURRENCY),
      },
      {
        accessorKey: "tax_base",
        header: "Base Imp.",
        cell: ({ row }) =>
          row.original.tax_base != null
            ? formatCurrency(row.original.tax_base, row.original.currency ?? DEFAULT_CURRENCY)
            : <span className="text-zinc-300">&mdash;</span>,
      },
      {
        accessorKey: "reference",
        header: "Referencia",
        cell: ({ row }) => row.original.reference || <span className="text-zinc-300">&mdash;</span>,
      },
      {
        accessorKey: "trimestre",
        header: "Trimestre",
        cell: ({ row }) => <Badge variant="secondary">{row.original.trimestre}</Badge>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row.original.id);
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [type]
  );

  const table = useReactTable({
    data: movements,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => String(row.id),
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

  const handleConfirmDelete = () => {
    if (deleteId !== null) {
      deleteMovement.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex items-center gap-2 shrink-0">
        <Link to={`/movements/${type}/new`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nuevo {type === "ingresos" ? "ingreso" : "gasto"}
          </Button>
        </Link>
        {selectedCount > 0 && (
          <Badge variant="secondary">{selectedCount} seleccionados</Badge>
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
            {movements.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-zinc-400">
                  No hay {type === "ingresos" ? "ingresos" : "gastos"} registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar movimiento</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El movimiento sera eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
