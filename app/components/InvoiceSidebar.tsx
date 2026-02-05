import { useRef, useEffect, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";

const statusDot: Record<string, string> = {
  pending: "bg-zinc-400",
  processed: "bg-emerald-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

import type { InvoiceWithVendor } from "~/lib/types";

type Invoice = Pick<InvoiceWithVendor, "id" | "file_name" | "status">;

interface InvoiceSidebarProps {
  invoices: Invoice[];
  currentIndex: number;
  isLoading: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  goNext: () => void;
  goPrev: () => void;
  type: string;
  currentBillId: string;
  searchString?: string;
}

export function InvoiceSidebar({
  invoices,
  currentIndex,
  isLoading,
  hasNext,
  hasPrev,
  goNext,
  goPrev,
  type,
  currentBillId,
  searchString = "",
}: InvoiceSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Auto-colapso responsive
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => setCollapsed(e.matches);
    onChange(mq);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Auto-scroll al item activo
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentBillId]);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-r border-zinc-200 dark:border-zinc-800 py-3 px-1.5 w-10 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
          title="Expandir sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
        <button
          onClick={goPrev}
          disabled={!hasPrev}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30"
          title="Anterior (k)"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <span className="text-[10px] text-zinc-400 font-mono leading-none">
          {currentIndex >= 0 ? `${currentIndex + 1}/${invoices.length}` : "-"}
        </span>
        <button
          onClick={goNext}
          disabled={!hasNext}
          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30"
          title="Siguiente (j)"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-r border-zinc-200 dark:border-zinc-800 w-60 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-xs font-medium text-zinc-500">
          {isLoading ? "Cargando..." : `${invoices.length} facturas`}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30"
            title="Anterior (k / ↑)"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 disabled:opacity-30"
            title="Siguiente (j / ↓)"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 ml-1"
            title="Colapsar sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Invoice list */}
      <div className="flex-1 min-h-0 overflow-auto">
        {invoices.map((inv) => {
          const isActive = String(inv.id) === currentBillId;
          return (
            <Link
              key={inv.id}
              ref={isActive ? activeRef : undefined}
              to={`/invoices/${type}/${inv.id}${searchString}`}
              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors border-b border-zinc-100 dark:border-zinc-800/50 ${
                isActive
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              }`}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[inv.status] || "bg-zinc-400"}`} />
              <span className="font-mono truncate">{inv.file_name}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 text-center">
          <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]">j</kbd>
          {" / "}
          <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]">k</kbd>
          {" para navegar"}
        </p>
      </div>
    </div>
  );
}
