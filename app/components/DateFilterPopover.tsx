import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Calendar } from "~/components/ui/calendar";
import { cn } from "~/lib/utils";
import {
  getDateFilterLabel,
  type DateFilter,
  type DateFilterMode,
} from "~/lib/invoice-filters";

const modes: { value: DateFilterMode; label: string }[] = [
  { value: "all", label: "Todo" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Año" },
  { value: "month", label: "Mes" },
  { value: "custom", label: "Rango" },
];

const quarterLabels = ["Q1", "Q2", "Q3", "Q4"];
const monthLabels = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

interface DateFilterPopoverProps {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
  availableYears: number[];
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function parseDateStr(str: string | undefined): Date | undefined {
  if (!str) return undefined;
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
}

export function DateFilterPopover({
  value,
  onChange,
  availableYears,
}: DateFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateFilter>(value);
  const activeMode = draft.mode;

  const years =
    availableYears.length > 0 ? availableYears : [new Date().getFullYear()];
  const selectedYear = draft.year ?? years[0];

  const handleModeChange = (mode: DateFilterMode) => {
    if (mode === "all") {
      const next: DateFilter = { mode: "all" };
      setDraft(next);
      onChange(next);
      setOpen(false);
      return;
    }
    setDraft((prev) => ({ ...prev, mode, year: prev.year ?? years[0] }));
  };

  const handleYearChange = (year: number) => {
    const next = { ...draft, year };
    setDraft(next);
    if (draft.mode === "year") {
      onChange(next);
      setOpen(false);
    }
  };

  const handleQuarterSelect = (q: number) => {
    const next: DateFilter = {
      mode: "quarter",
      year: selectedYear,
      quarter: q,
    };
    setDraft(next);
    onChange(next);
    setOpen(false);
  };

  const handleMonthSelect = (m: number) => {
    const next: DateFilter = { mode: "month", year: selectedYear, month: m };
    setDraft(next);
    onChange(next);
    setOpen(false);
  };

  const handleRangeApply = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(value);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
          <CalendarDays className="mr-1 h-3 w-3 opacity-50" />
          {getDateFilterLabel(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        {/* Mode tabs */}
        <div className="flex gap-1 mb-3">
          {modes.map((m) => (
            <Button
              key={m.value}
              variant={activeMode === m.value ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => handleModeChange(m.value)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        {/* Year selector for quarter/year/month */}
        {(activeMode === "quarter" ||
          activeMode === "year" ||
          activeMode === "month") && (
          <div className="flex gap-1 mb-3 flex-wrap">
            {years
              .sort((a, b) => a - b)
              .map((y) => (
                <Button
                  key={y}
                  variant={selectedYear === y ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleYearChange(y)}
                >
                  {y}
                </Button>
              ))}
          </div>
        )}

        {/* Quarter grid */}
        {activeMode === "quarter" && (
          <div className="grid grid-cols-2 gap-2">
            {quarterLabels.map((label, i) => (
              <Button
                key={i}
                variant={
                  draft.quarter === i + 1 && draft.year === selectedYear
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleQuarterSelect(i + 1)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}

        {/* Month grid */}
        {activeMode === "month" && (
          <div className="grid grid-cols-4 gap-2">
            {monthLabels.map((label, i) => (
              <Button
                key={i}
                variant={
                  draft.month === i && draft.year === selectedYear
                    ? "default"
                    : "outline"
                }
                size="sm"
                className={cn("h-8 text-xs px-1")}
                onClick={() => handleMonthSelect(i)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}

        {/* Custom range */}
        {activeMode === "custom" && (
          <div className="space-y-3">
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Desde</p>
                <Calendar
                  mode="single"
                  selected={parseDateStr(draft.from)}
                  onSelect={(d) =>
                    setDraft((prev) => ({
                      ...prev,
                      from: d ? formatDate(d) : undefined,
                    }))
                  }
                />
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Hasta</p>
                <Calendar
                  mode="single"
                  selected={parseDateStr(draft.to)}
                  onSelect={(d) =>
                    setDraft((prev) => ({
                      ...prev,
                      to: d ? formatDate(d) : undefined,
                    }))
                  }
                />
              </div>
            </div>
            <Button size="sm" className="w-full" onClick={handleRangeApply}>
              Aplicar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
