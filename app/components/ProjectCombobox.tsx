import { VendorCombobox } from "./VendorCombobox";
import type { ProjectRow } from "~/lib/types";

interface ProjectComboboxProps {
  projects: ProjectRow[];
  value: string | null;
  onSelect: (projectId: string) => void;
  onCreate: (name: string) => void;
  onClear: () => void;
  disabled?: boolean;
  placeholder?: string;
  clearable?: boolean;
}

export function ProjectCombobox({
  projects,
  value,
  onSelect,
  onCreate,
  onClear,
  disabled,
  placeholder = "Seleccionar proyecto...",
  clearable,
}: ProjectComboboxProps) {
  // Mapear projects a formato compatible con VendorCombobox
  const items = projects.map((p) => ({ id: p.id, raw_name: p.name }));

  return (
    <VendorCombobox
      vendors={items}
      value={value}
      onSelect={onSelect}
      onCreate={onCreate}
      onClear={onClear}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder="Buscar proyecto..."
      entityLabel="proyecto"
      clearable={clearable}
    />
  );
}
