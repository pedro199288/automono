// Categorías predefinidas para movimientos financieros

export const ingresoCategories = [
  { value: "baja_laboral", label: "Baja laboral" },
  { value: "subvencion", label: "Subvención" },
  { value: "devolucion_hacienda", label: "Devolución Hacienda" },
  { value: "transferencia_estado", label: "Transferencia del Estado" },
  { value: "otro_ingreso", label: "Otro ingreso" },
] as const;

export const gastoCategories = [
  { value: "irpf", label: "IRPF" },
  { value: "iva", label: "IVA" },
  { value: "autonomo", label: "Cuota autónomo" },
  { value: "tasa", label: "Tasa" },
  { value: "seguro", label: "Seguro" },
  { value: "otro_gasto", label: "Otro gasto" },
] as const;

export type IngresoCategory = (typeof ingresoCategories)[number]["value"];
export type GastoCategory = (typeof gastoCategories)[number]["value"];
export type MovementCategory = IngresoCategory | GastoCategory;

export function getCategoriesForType(type: "ingresos" | "gastos") {
  return type === "ingresos" ? ingresoCategories : gastoCategories;
}

export function getCategoryLabel(category: string): string {
  const all = [...ingresoCategories, ...gastoCategories];
  return all.find((c) => c.value === category)?.label ?? category;
}

export const categoryColors: Record<string, string> = {
  // Ingresos
  baja_laboral: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  subvencion: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  devolucion_hacienda: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
  transferencia_estado: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  otro_ingreso: "bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300",
  // Gastos
  irpf: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  iva: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  autonomo: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  tasa: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  seguro: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  otro_gasto: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};
