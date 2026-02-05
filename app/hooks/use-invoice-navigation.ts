import { useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import type { InvoiceWithVendor } from "~/lib/types";

export function useInvoiceNavigation(
  type: string | undefined,
  billId: string | undefined,
  filteredInvoices: InvoiceWithVendor[],
  searchString: string,
) {
  const navigate = useNavigate();

  const currentIndex = useMemo(
    () => (billId ? filteredInvoices.findIndex((inv) => inv.id === Number(billId)) : -1),
    [filteredInvoices, billId]
  );

  const hasNext = currentIndex >= 0 && currentIndex < filteredInvoices.length - 1;
  const hasPrev = currentIndex > 0;

  const goNext = useCallback(() => {
    if (!hasNext) return;
    const next = filteredInvoices[currentIndex + 1];
    navigate(`/invoices/${type}/${next.id}${searchString}`);
  }, [hasNext, filteredInvoices, currentIndex, navigate, type, searchString]);

  const goPrev = useCallback(() => {
    if (!hasPrev) return;
    const prev = filteredInvoices[currentIndex - 1];
    navigate(`/invoices/${type}/${prev.id}${searchString}`);
  }, [hasPrev, filteredInvoices, currentIndex, navigate, type, searchString]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  return { invoices: filteredInvoices, currentIndex, goNext, goPrev, hasNext, hasPrev };
}
