import type { GastosData, IngresosData } from "~/lib/types";

// Re-exportar para compatibilidad
export type { GastosData, IngresosData };

function val(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

export function gastoToTSV(data: GastosData, fileName: string, vendorName?: string | null): string {
  return [
    val(data.fecha),
    fileName,
    val(data.numero_factura),
    val(vendorName ?? data.proveedor),
    val(data.concepto),
    val(data.base_imponible),
    data.tipo_iva != null ? `${data.tipo_iva}%` : "",
    val(data.iva),
    val(data.total),
    val(data.categoria),
  ].join("\t");
}

export function ingresoToTSV(data: IngresosData, vendorName?: string | null): string {
  return [
    val(data.fecha_factura),
    val(data.numero_factura),
    val(vendorName ?? data.cliente),
    val(data.proyecto),
    val(data.descripcion),
    val(data.base_imponible),
    data.tipo_iva != null ? `${data.tipo_iva}%` : "",
    val(data.iva),
    val(data.total_factura),
    val(data.irpf),
    "", // Fecha cobro (manual)
    "", // Estado (manual)
  ].join("\t");
}

export function invoicesToTSV(
  invoices: Array<{ folder_type: string; file_name: string; extracted_data: string | null; vendor_name?: string | null }>
): string {
  return invoices
    .filter((inv) => inv.extracted_data)
    .map((inv) => {
      const data = JSON.parse(inv.extracted_data!);
      if (inv.folder_type === "gastos") {
        return gastoToTSV(data as GastosData, inv.file_name, inv.vendor_name);
      }
      return ingresoToTSV(data as IngresosData, inv.vendor_name);
    })
    .join("\n");
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
