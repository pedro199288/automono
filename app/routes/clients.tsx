import { VendorManager } from "~/components/VendorManager";

export default function ClientsPage() {
  return (
    <div className="space-y-6 flex-1 min-h-0 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Clientes</h2>
        <p className="text-zinc-500">
          Gestiona los clientes registrados
        </p>
      </div>

      <VendorManager type="client" title="Clientes" entityName="cliente" />

      <div className="rounded-md bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-900">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">Como funciona</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Los clientes se crean automaticamente al procesar facturas de ingresos</li>
          <li>Puedes asignar etiquetas personalizadas para identificarlos facilmente</li>
        </ul>
      </div>
    </div>
  );
}
