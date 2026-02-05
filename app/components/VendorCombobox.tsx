import { useState } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
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
import type { VendorRow } from "~/lib/types";

type Vendor = Pick<VendorRow, "id" | "raw_name">;

interface VendorComboboxProps {
  vendors: Vendor[];
  value: string | null;
  onSelect: (vendorId: string) => void;
  onCreate: (rawName: string) => void;
  onClear: () => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  entityLabel?: string;
  clearable?: boolean;
}

export function VendorCombobox({
  vendors,
  value,
  onSelect,
  onCreate,
  onClear,
  disabled,
  placeholder = "Seleccionar proveedor...",
  searchPlaceholder = "Buscar proveedor...",
  entityLabel = "proveedor",
  clearable,
}: VendorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedVendor = vendors.find((v) => v.id === value);

  const filtered = vendors.filter((v) => {
    if (!search) return true;
    return v.raw_name.toLowerCase().includes(search.toLowerCase());
  });

  const exactMatch = vendors.some((v) => {
    return v.raw_name.toLowerCase() === search.toLowerCase();
  });

  const showCreate = search.trim().length > 0 && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-7 justify-between text-xs font-normal flex-1 min-w-0"
          >
            <span className="truncate">
              {selectedVendor ? selectedVendor.raw_name : placeholder}
            </span>
            <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        {(value || clearable) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <PopoverContent className="p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No se encontraron {entityLabel}s.</CommandEmpty>
            {showCreate && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onCreate(search.trim());
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  Crear &ldquo;{search.trim()}&rdquo; como nuevo {entityLabel}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {filtered.map((vendor) => (
                <CommandItem
                  key={vendor.id}
                  value={vendor.id}
                  onSelect={() => {
                    onSelect(vendor.id);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === vendor.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{vendor.raw_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
