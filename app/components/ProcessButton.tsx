import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { useProcessBatchSequential } from "~/hooks/use-invoices";

interface ProcessButtonProps {
  invoiceIds: number[];
  label: string;
  disabled?: boolean;
  showProgressBar?: boolean;
}

export function ProcessButton({ invoiceIds, label, disabled, showProgressBar = false }: ProcessButtonProps) {
  const { process, progress } = useProcessBatchSequential();

  const handleProcess = () => {
    if (invoiceIds.length === 0 || progress.isProcessing) return;
    process(invoiceIds);
  };

  const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        disabled={disabled || progress.isProcessing || invoiceIds.length === 0}
        onClick={handleProcess}
      >
        <Sparkles className="mr-1 h-3 w-3" />
        {progress.isProcessing
          ? `Procesando ${progress.completed + 1}/${progress.total}...`
          : label}
      </Button>
      {showProgressBar && progress.isProcessing && (
        <>
          <div className="h-2 w-32 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">{pct}%</span>
        </>
      )}
      {showProgressBar && !progress.isProcessing && progress.errors.length > 0 && (
        <span className="text-xs text-red-500">{progress.errors.length} error(es)</span>
      )}
    </div>
  );
}
