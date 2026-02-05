import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
import { VendorCombobox } from "./VendorCombobox";
import { useVendors, useCreateVendor } from "~/hooks/use-invoices";
import { getCategoriesForType } from "~/lib/movement-categories";
import { DEFAULT_CURRENCY, CURRENCY_OPTIONS } from "~/lib/utils";
import type { MovementWithVendor } from "~/lib/types";

interface MovementFormProps {
  type: "ingresos" | "gastos";
  movement?: MovementWithVendor;
  onSubmit: (data: MovementFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface MovementFormData {
  type: "ingresos" | "gastos";
  category: string;
  date: string;
  description: string;
  amount: number;
  tax_base?: number | null;
  vat_rate?: number | null;
  vat_amount?: number | null;
  currency: string;
  trimestre: string;
  reference?: string | null;
  vendor_id?: string | null;
  notes?: string | null;
}

function getCurrentTrimestre(): string {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return `${year}-Q${quarter}`;
}

function formatDateForInput(dateStr: string): string {
  // DD/MM/YYYY -> YYYY-MM-DD
  const [d, m, y] = dateStr.split("/");
  if (d && m && y) return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  return "";
}

function formatDateForDB(dateStr: string): string {
  // YYYY-MM-DD -> DD/MM/YYYY
  const [y, m, d] = dateStr.split("-");
  if (d && m && y) return `${d}/${m}/${y}`;
  return dateStr;
}

function getTrimestreFromDate(dateStr: string): string {
  // YYYY-MM-DD
  const [y, m] = dateStr.split("-");
  if (!y || !m) return getCurrentTrimestre();
  const quarter = Math.ceil(Number(m) / 3);
  return `${y}-Q${quarter}`;
}

export function MovementForm({ type, movement, onSubmit, onCancel, isSubmitting }: MovementFormProps) {
  const categories = getCategoriesForType(type);
  const { data: vendorsData } = useVendors();
  const createVendor = useCreateVendor();

  const [form, setForm] = useState({
    category: movement?.category ?? categories[0]?.value ?? "",
    date: movement?.date ? formatDateForInput(movement.date) : "",
    description: movement?.description ?? "",
    amount: movement?.amount?.toString() ?? "",
    tax_base: movement?.tax_base?.toString() ?? "",
    vat_rate: movement?.vat_rate?.toString() ?? "",
    vat_amount: movement?.vat_amount?.toString() ?? "",
    currency: movement?.currency ?? DEFAULT_CURRENCY,
    reference: movement?.reference ?? "",
    vendor_id: movement?.vendor_id ?? null,
    notes: movement?.notes ?? "",
  });

  // Auto-calculate trimestre from date
  const trimestre = form.date ? getTrimestreFromDate(form.date) : getCurrentTrimestre();

  const handleChange = (field: string, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      category: form.category,
      date: formatDateForDB(form.date),
      description: form.description,
      amount: Number(form.amount) || 0,
      tax_base: form.tax_base ? Number(form.tax_base) : null,
      vat_rate: form.vat_rate ? Number(form.vat_rate) : null,
      vat_amount: form.vat_amount ? Number(form.vat_amount) : null,
      currency: form.currency,
      trimestre,
      reference: form.reference || null,
      vendor_id: form.vendor_id,
      notes: form.notes || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            id="category"
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            required
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripcion</Label>
        <Input
          id="description"
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Descripcion del movimiento..."
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Importe total</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax_base">Base imponible</Label>
          <Input
            id="tax_base"
            type="number"
            step="0.01"
            value={form.tax_base}
            onChange={(e) => handleChange("tax_base", e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Select
            id="currency"
            value={form.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vat_rate">% IVA</Label>
          <Input
            id="vat_rate"
            type="number"
            step="0.01"
            value={form.vat_rate}
            onChange={(e) => handleChange("vat_rate", e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vat_amount">Importe IVA</Label>
          <Input
            id="vat_amount"
            type="number"
            step="0.01"
            value={form.vat_amount}
            onChange={(e) => handleChange("vat_amount", e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reference">Referencia</Label>
          <Input
            id="reference"
            value={form.reference}
            onChange={(e) => handleChange("reference", e.target.value)}
            placeholder="Num. recibo/referencia"
          />
        </div>

        <div className="space-y-2">
          <Label>Trimestre (auto)</Label>
          <Input value={trimestre} disabled className="bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Proveedor/Entidad</Label>
        <VendorCombobox
          vendors={vendorsData?.vendors ?? []}
          value={form.vendor_id}
          onSelect={(id) => handleChange("vendor_id", id)}
          onCreate={(name) => {
            createVendor.mutate({ raw_name: name }, {
              onSuccess: (data) => handleChange("vendor_id", data.vendor.id),
            });
          }}
          onClear={() => handleChange("vendor_id", null)}
          placeholder="Seleccionar entidad..."
          entityLabel="entidad"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Notas adicionales..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : movement ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
