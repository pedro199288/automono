import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import { Badge } from "~/components/ui/badge";

const categoriaOptions = [
  "Hardware",
  "Software y Herramientas Online",
  "Formación y Desarrollo Profesional",
  "Marketing y Publicidad",
  "Gastos de Oficina/Actividad y Suministros",
  "Asesoría y Servicios Externos",
  "Otros",
];

const categoriaColors: Record<string, string> = {
  "Hardware": "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  "Software y Herramientas Online": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "Formación y Desarrollo Profesional": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Marketing y Publicidad": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Gastos de Oficina/Actividad y Suministros": "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
  "Asesoría y Servicios Externos": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "Otros": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

interface CategoriaSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CategoriaSelect({
  value,
  onChange,
  disabled,
  placeholder = "Seleccionar categoría...",
  className,
}: CategoriaSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = categoriaOptions.filter((opt) => {
    if (!search) return true;
    return opt.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("flex items-center gap-1", className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-8 justify-between text-xs font-normal flex-1 min-w-0"
          >
            {value ? (
              <Badge className={cn("text-xs", categoriaColors[value])}>
                {value}
              </Badge>
            ) : (
              <span className="text-zinc-500">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <PopoverContent className="p-0 w-[280px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar categoría..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No se encontraron categorías.</CommandEmpty>
            <CommandGroup>
              {filtered.map((categoria) => (
                <CommandItem
                  key={categoria}
                  value={categoria}
                  onSelect={() => {
                    onChange(categoria);
                    setSearch("");
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      value === categoria ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Badge className={cn("text-xs", categoriaColors[categoria])}>
                    {categoria}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { categoriaOptions, categoriaColors };
