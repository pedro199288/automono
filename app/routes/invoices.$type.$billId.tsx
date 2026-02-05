import { useState } from "react";
import { useParams, Link, useSearchParams, useNavigate } from "react-router";
import {
  useInvoice,
  useInvoicesByType,
  useUpdateInvoice,
  useVendors,
  useCreateVendor,
  useAssignVendor,
  useProcessInvoice,
  useDeleteInvoice,
} from "~/hooks/use-invoices";
import { useInvoiceNavigation } from "~/hooks/use-invoice-navigation";
import { useInvoiceFilters } from "~/hooks/use-invoice-filters";
import {
  formatCurrency,
  isMonetaryField,
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
} from "~/lib/utils";
import { InvoiceSidebar } from "~/components/InvoiceSidebar";
import { VendorCombobox } from "~/components/VendorCombobox";
import { CategoriaSelect, categoriaColors } from "~/components/CategoriaSelect";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  FileText,
  Code,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "~/components/ui/alert-dialog";

const statusVariant: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  pending: "secondary",
  processed: "success",
  warning: "warning",
  error: "destructive",
};

const gastoFields = [
  "fecha",
  "numero_factura",
  "proveedor",
  "concepto",
  "base_imponible",
  "tipo_iva",
  "iva",
  "total",
  "currency",
  "categoria",
];
const ingresoFields = [
  "fecha_factura",
  "numero_factura",
  "cliente",
  "proyecto",
  "descripcion",
  "base_imponible",
  "tipo_iva",
  "iva",
  "total_factura",
  "irpf",
  "currency",
];

const gastosHeaderLabels: Record<string, string> = {
  fecha: "Fecha",
  numero_factura: "N.º Factura",
  proveedor: "Proveedor",
  concepto: "Concepto",
  base_imponible: "Base Imponible",
  tipo_iva: "IVA %",
  iva: "IVA",
  total: "Total",
  currency: "Moneda",
  categoria: "Categoría",
};

const ingresosHeaderLabels: Record<string, string> = {
  fecha_factura: "Fecha",
  numero_factura: "N.º Factura",
  cliente: "Cliente",
  proyecto: "Proyecto",
  descripcion: "Descripción",
  base_imponible: "Base Imponible",
  tipo_iva: "IVA %",
  iva: "IVA",
  total_factura: "Total",
  irpf: "IRPF",
  currency: "Moneda",
};


function getFields(folderType: string) {
  return folderType === "gastos" ? gastoFields : ingresoFields;
}

function getHeaderLabels(folderType: string): Record<string, string> {
  return folderType === "gastos" ? gastosHeaderLabels : ingresosHeaderLabels;
}

function convertFieldValue(value: string): unknown {
  if (value === "") return null;
  return isNaN(Number(value)) ? value : Number(value);
}

export default function InvoiceDetail() {
  const { type, billId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchString =
    searchParams.size > 0 ? `?${searchParams.toString()}` : "";

  const { data: allData } = useInvoicesByType(type ?? "");
  const allInvoices = allData?.invoices ?? [];
  const { filteredInvoices } = useInvoiceFilters(allInvoices);

  const nav = useInvoiceNavigation(
    type,
    billId,
    filteredInvoices,
    searchString,
  );
  const { data, isLoading, error } = useInvoice(billId ? Number(billId) : null);
  const updateInvoice = useUpdateInvoice();
  const { data: vendorsData } = useVendors();
  const createVendor = useCreateVendor();
  const assignVendor = useAssignVendor();
  const processInvoice = useProcessInvoice();
  const deleteInvoice = useDeleteInvoice();

  const [leftPanel, setLeftPanel] = useState<"pdf" | "raw">("pdf");
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  const sidebar = (
    <InvoiceSidebar
      invoices={nav.invoices}
      currentIndex={nav.currentIndex}
      isLoading={false}
      hasNext={nav.hasNext}
      hasPrev={nav.hasPrev}
      goNext={nav.goNext}
      goPrev={nav.goPrev}
      type={type ?? ""}
      currentBillId={billId ?? ""}
      searchString={searchString}
    />
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0">
        {sidebar}
        <div className="flex flex-col flex-1 min-w-0 items-center justify-center py-20">
          <p className="text-zinc-500">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.invoice) {
    return (
      <div className="flex flex-1 min-h-0">
        {sidebar}
        <div className="flex flex-col flex-1 min-w-0 space-y-4 p-6">
          <Link to={`/invoices/${type}${searchString}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <p className="text-red-500">No se pudo cargar la factura.</p>
        </div>
      </div>
    );
  }

  const invoice = data.invoice;
  const fields = getFields(invoice.folder_type);
  const headerLabels = getHeaderLabels(invoice.folder_type);
  const vendorField =
    invoice.folder_type === "gastos" ? "proveedor" : "cliente";
  const entityLabel =
    invoice.folder_type === "gastos" ? "Proveedor" : "Cliente";

  let extractedData: Record<string, unknown> | null = null;
  if (invoice.extracted_data) {
    try {
      extractedData = JSON.parse(invoice.extracted_data);
    } catch {
      // extracted_data no es JSON válido
    }
  }

  const startEdit = () => {
    if (extractedData) {
      setEditData({ ...extractedData });
    } else {
      const empty: Record<string, unknown> = {};
      for (const f of fields) empty[f] = null;
      setEditData(empty);
    }
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditData({});
  };

  const saveEdit = () => {
    const dataToSave: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(editData)) {
      if (key === vendorField) continue;
      dataToSave[key] = convertFieldValue(String(value ?? ""));
    }
    updateInvoice.mutate(
      { id: invoice.id, extracted_data: JSON.stringify(dataToSave) },
      { onSuccess: () => setEditing(false) },
    );
  };

  const updateField = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value === "" ? null : value }));
  };

  const handleVendorSelect = (vendorId: string) => {
    assignVendor.mutate({ invoiceId: invoice.id, vendorId });
  };

  const handleVendorCreate = (rawName: string) => {
    createVendor.mutate(
      { raw_name: rawName },
      {
        onSuccess: (data) => {
          assignVendor.mutate({
            invoiceId: invoice.id,
            vendorId: data.vendor.id,
          });
        },
      },
    );
  };

  const handleVendorClear = () => {
    assignVendor.mutate({ invoiceId: invoice.id, vendorId: null, vendorField });
    if (editing) setEditData((prev) => ({ ...prev, [vendorField]: null }));
  };

  const getDisplayValue = (key: string, value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (isMonetaryField(key, invoice.folder_type)) {
      return formatCurrency(
        value,
        extractedData?.currency as string | null ?? DEFAULT_CURRENCY,
      );
    }
    return String(value);
  };

  console.log("invoice", invoice);

  return (
    <div className="flex flex-1 min-h-0">
      {sidebar}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-2 p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            <Link to={`/invoices/${type}${searchString}`}>
              <Button variant="ghost" size="sm" className="w-fit">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </Link>
            <h1 className="text-lg font-semibold font-mono break-all">
              {invoice.file_name}
            </h1>
            <Badge variant={statusVariant[invoice.status] || "secondary"}>
              {invoice.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => processInvoice.mutate(invoice.id)}
              disabled={processInvoice.isPending || !invoice.raw_text}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              {processInvoice.isPending ? "Procesando..." : "Reprocesar"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deleteInvoice.isPending}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {deleteInvoice.isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar factura</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente la factura "{invoice.file_name}".
                    Si el proveedor/cliente asociado no tiene otras facturas, también será eliminado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      deleteInvoice.mutate(invoice.id, {
                        onSuccess: () => {
                          navigate(`/invoices/${type}`);
                        },
                      });
                    }}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-zinc-500 pl-1">
            <span>
              Trimestre:{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">
                {invoice.trimestre}
              </strong>
            </span>
            <span>
              Tipo:{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">
                {invoice.folder_type}
              </strong>
            </span>
            {invoice.subfolder && (
              <span>
                Subcarpeta:{" "}
                <strong className="text-zinc-700 dark:text-zinc-300">
                  {invoice.subfolder}
                </strong>
              </span>
            )}
          </div>
          {invoice.warning_message && (
            <p className="text-sm text-yellow-600 pl-1">
              {invoice.warning_message}
            </p>
          )}
        </div>

        {/* Two-column layout: PDF wider than extracted data */}
        <div className="xl:grid min-h-0 xl:grid-cols-[2fr_1fr] overflow-y-scroll">
          {/* Left panel: PDF / Raw text */}
          <div className="flex flex-col border-r border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-1 p-2 border-b border-zinc-200 dark:border-zinc-800">
              <Button
                variant={leftPanel === "pdf" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLeftPanel("pdf")}
              >
                <FileText className="mr-1 h-3 w-3" />
                PDF
              </Button>
              <Button
                variant={leftPanel === "raw" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLeftPanel("raw")}
              >
                <Code className="mr-1 h-3 w-3" />
                Texto
              </Button>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {leftPanel === "pdf" ? (
                <div className="flex flex-col h-full">
                  {invoice.drive_file_id ? (
                    <>
                      <iframe
                        src={`/api/drive/file/${invoice.drive_file_id}`}
                        className="w-full border-0"
                        style={{ minHeight: "calc(100vh - 250px)" }}
                        title={invoice.file_name}
                      />
                      <div className="text-center p-3">
                        <a
                          href={`/api/drive/file/${invoice.drive_file_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                        >
                          Abrir PDF en nueva pestaña
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full p-8">
                      <p className="text-sm text-zinc-400 italic">
                        No hay archivo de Drive asociado.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  {invoice.raw_text ? (
                    <pre className="whitespace-pre-wrap text-xs font-mono text-zinc-700 dark:text-zinc-300">
                      {invoice.raw_text}
                    </pre>
                  ) : (
                    <p className="text-sm text-zinc-400 italic">
                      No hay texto crudo disponible.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Extracted data */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between p-2 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-sm font-medium text-zinc-500 pl-1">
                Datos extraídos
              </h2>
              {!editing && (
                <Button variant="ghost" size="sm" onClick={startEdit}>
                  <Pencil className="mr-1 h-3 w-3" />
                  {extractedData ? "Editar" : "Introducir datos manualmente"}
                </Button>
              )}
              {editing && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveEdit}
                    disabled={updateInvoice.isPending}
                  >
                    <Save className="mr-1 h-3 w-3" />
                    Guardar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="mr-1 h-3 w-3" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-auto p-4">
              {editing || extractedData ? (
                <table className="w-full text-sm">
                  <tbody>
                    {fields.map((key) => {
                      const value = editing
                        ? editData[key]
                        : extractedData?.[key];
                      const isVendorField = key === vendorField;
                      const displayValue = !editing
                        ? getDisplayValue(key, value)
                        : null;

                      return (
                        <tr
                          key={key}
                          className="border-b border-zinc-200 dark:border-zinc-800 last:border-0"
                        >
                          <td className="py-2 pr-4 font-medium text-zinc-500 whitespace-nowrap align-top">
                            {headerLabels[key] || key}
                          </td>
                          <td className="py-2 text-zinc-700 dark:text-zinc-300">
                            {isVendorField ? (
                              <div className="max-w-xs">
                                <VendorCombobox
                                  vendors={vendorsData?.vendors ?? []}
                                  value={invoice.vendor_id}
                                  onSelect={handleVendorSelect}
                                  onCreate={handleVendorCreate}
                                  onClear={handleVendorClear}
                                  disabled={
                                    assignVendor.isPending ||
                                    createVendor.isPending
                                  }
                                  placeholder={
                                    (
                                      editing
                                        ? editData[vendorField]
                                        : extractedData?.[vendorField]
                                    )
                                      ? String(
                                          editing
                                            ? editData[vendorField]
                                            : extractedData?.[vendorField],
                                        )
                                      : `Seleccionar ${entityLabel.toLowerCase()}...`
                                  }
                                  searchPlaceholder={`Buscar ${entityLabel.toLowerCase()}...`}
                                  entityLabel={entityLabel.toLowerCase()}
                                  clearable={
                                    !!(editing
                                      ? editData[vendorField]
                                      : extractedData?.[vendorField])
                                  }
                                />
                              </div>
                            ) : editing ? (
                              key === "categoria" &&
                              invoice.folder_type === "gastos" ? (
                                <CategoriaSelect
                                  value={
                                    editData[key] != null
                                      ? String(editData[key])
                                      : null
                                  }
                                  onChange={(val) =>
                                    setEditData((prev) => ({
                                      ...prev,
                                      [key]: val,
                                    }))
                                  }
                                />
                              ) : key === "currency" ? (
                                <Select
                                  className="h-9 text-xs"
                                  value={
                                    editData[key] != null
                                      ? String(editData[key])
                                      : DEFAULT_CURRENCY
                                  }
                                  onChange={(e) =>
                                    setEditData((prev) => ({
                                      ...prev,
                                      [key]: e.target.value || null,
                                    }))
                                  }
                                >
                                  {CURRENCY_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </Select>
                              ) : (
                                <Input
                                  className="h-7 text-xs"
                                  value={
                                    editData[key] != null
                                      ? String(editData[key])
                                      : ""
                                  }
                                  onChange={(e) =>
                                    updateField(key, e.target.value)
                                  }
                                />
                              )
                            ) : (
                              <div className="flex items-center gap-2">
                                {displayValue === null ? (
                                  <span className="text-zinc-300">&mdash;</span>
                                ) : key === "categoria" &&
                                  invoice.folder_type === "gastos" ? (
                                  <Badge
                                    className={
                                      categoriaColors[displayValue] ||
                                      "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                    }
                                  >
                                    {displayValue}
                                  </Badge>
                                ) : (
                                  <span>{displayValue}</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-zinc-400 italic">
                  No hay datos extraídos disponibles.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
