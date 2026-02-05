// Tipo unificado para la tabla de records
export interface UnifiedRecord {
  id: string; // "inv-123" o "mov-456"
  source: "invoice" | "movement";
  type: "gastos" | "ingresos";
  date: string; // DD/MM/YYYY
  description: string;
  amount: number;
  taxBase: number | null;
  vatRate: number | null;
  category: string | null;
  vendorId: string | null;
  vendorName: string | null;
  trimestre: string;
  // Metadatos especificos
  invoiceData?: {
    fileName: string;
    status: string;
    driveFileId: string;
  };
  movementData?: {
    reference: string | null;
    notes: string | null;
  };
}

export type RecordSource = "all" | "invoice" | "movement";
