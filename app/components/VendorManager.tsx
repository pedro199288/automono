import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { useVendors, useCreateVendor, useDeleteVendor } from "~/hooks/use-invoices";
import { Save, X, Plus, Trash2 } from "lucide-react";

interface VendorManagerProps {
  type: "provider" | "client";
  title: string;
  entityName: string;
}

export function VendorManager({ type, title, entityName }: VendorManagerProps) {
  const { data, isLoading } = useVendors(type);
  const createVendor = useCreateVendor();
  const deleteVendorMutation = useDeleteVendor();

  const [showCreate, setShowCreate] = useState(false);
  const [newRawName, setNewRawName] = useState("");

  const handleCreate = () => {
    if (!newRawName.trim()) return;
    createVendor.mutate(
      { raw_name: newRawName.trim(), type },
      {
        onSuccess: () => {
          setNewRawName("");
          setShowCreate(false);
        },
      }
    );
  };

  const vendors = data?.vendors ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title} ({vendors.length})</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1 h-3 w-3" /> Nuevo {entityName}
        </Button>
      </CardHeader>
      <CardContent>
        {showCreate && (
          <div className="mb-4 rounded-md border border-zinc-200 p-3 dark:border-zinc-800 space-y-2">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Crear {entityName}</h3>
            <Input
              placeholder={`Nombre del ${entityName}`}
              value={newRawName}
              onChange={(e) => setNewRawName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={!newRawName.trim() || createVendor.isPending}>
                <Save className="mr-1 h-3 w-3" /> Crear
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowCreate(false); setNewRawName(""); }}>
                <X className="mr-1 h-3 w-3" /> Cancelar
              </Button>
            </div>
          </div>
        )}

        {isLoading && <p className="text-zinc-400">Cargando...</p>}

        {vendors.length === 0 && !isLoading && (
          <p className="py-4 text-center text-zinc-400">
            No hay {entityName}s registrados. Procesa algunas facturas o crea uno manualmente.
          </p>
        )}

        {vendors.length > 0 && (
          <div className="space-y-2">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {vendor.raw_name}
                  </span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-400 hover:text-red-500"
                        disabled={deleteVendorMutation.isPending}
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar {vendor.raw_name}</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Las facturas vinculadas a este registro perderán la referencia.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteVendorMutation.mutate(vendor.id)} disabled={deleteVendorMutation.isPending}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
