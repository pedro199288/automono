import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_OPTIONS = [
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "JPY",
  "CAD",
  "AUD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "MXN",
  "BRL",
  "CNY",
] as const;

export const DEFAULT_CURRENCY = "EUR";

/**
 * Redondea un valor monetario a la baja con precisión de céntimos.
 * Usa compensación para evitar errores de punto flotante.
 * @param value - Valor a redondear
 * @param decimals - Número de decimales (default: 2)
 */
export function roundCurrencyDown(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  // Compensar errores de punto flotante antes de truncar
  const corrected = Math.round(value * factor * 1e10) / 1e10;
  return Math.floor(corrected) / factor;
}

export function formatCurrency(
  value: unknown,
  currency?: string | null,
): string | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  if (isNaN(num)) return null;
  // Redondear a la baja antes de formatear para evitar que Intl.NumberFormat redondee hacia arriba
  const rounded = roundCurrencyDown(num);
  try {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency || DEFAULT_CURRENCY,
    }).format(rounded);
  } catch {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: DEFAULT_CURRENCY,
    }).format(rounded);
  }
}

export const MONETARY_FIELDS_GASTOS = new Set([
  "base_imponible",
  "iva",
  "total",
]);

export const MONETARY_FIELDS_INGRESOS = new Set([
  "base_imponible",
  "iva",
  "total_factura",
  "irpf",
]);

export function isMonetaryField(field: string, folderType: string): boolean {
  if (folderType === "gastos") return MONETARY_FIELDS_GASTOS.has(field);
  if (folderType === "ingresos") return MONETARY_FIELDS_INGRESOS.has(field);
  return false;
}
