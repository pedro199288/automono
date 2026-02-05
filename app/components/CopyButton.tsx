import { useState } from "react";
import { Button } from "./ui/button";
import { Copy, Check } from "lucide-react";
import { invoicesToTSV, copyToClipboard } from "~/lib/clipboard";

interface CopyButtonProps {
  invoices: Array<{ folder_type: string; file_name: string; extracted_data: string | null; vendor_name?: string | null }>;
  disabled?: boolean;
}

export function CopyButton({ invoices, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const processedInvoices = invoices.filter((i) => i.extracted_data);
    if (processedInvoices.length === 0) return;

    const tsv = invoicesToTSV(processedInvoices);
    await copyToClipboard(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" size="sm" disabled={disabled} onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="mr-1 h-3 w-3 text-green-500" /> Copiado
        </>
      ) : (
        <>
          <Copy className="mr-1 h-3 w-3" /> Copiar TSV
        </>
      )}
    </Button>
  );
}
