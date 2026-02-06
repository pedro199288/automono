import type { InvoiceRow, VendorRow, InvoiceWithVendor, MovementRow, MovementWithVendor, ProjectRow } from "../../server/db/zod-schemas";

// Re-exportar tipos del servidor
export type { InvoiceRow, VendorRow, InvoiceWithVendor, MovementRow, MovementWithVendor, ProjectRow };

// Tipo para datos del LLM
export type { GastosData, IngresosData, InvoiceData } from "../../server/services/llm";

export type { ExcludedFolderRow } from "../../server/db/zod-schemas";

// Tipos específicos del cliente
export interface TrimestreStats {
  trimestre: string;
  stats: Array<{
    folder_type: string;
    total: number;
    processed: number;
    pending: number;
    warnings: number;
    errors: number;
  }>;
}
