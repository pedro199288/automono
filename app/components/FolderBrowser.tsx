import { useState } from "react";
import { useDriveFolders, useDriveFolder, useSyncFolder, useExcludedFolders, useExcludeFolder, useRemoveExclusion, useDeleteInvoicesBySubfolder } from "~/hooks/use-invoices";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Folder, FileText, RefreshCw, ChevronRight, ArrowLeft, EyeOff, Eye, Trash2 } from "lucide-react";

const FOLDER_MIME = "application/vnd.google-apps.folder";

interface BreadcrumbItem {
  id: string;
  name: string;
}

export function FolderBrowser() {
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [syncingFolder, setSyncingFolder] = useState<string | null>(null);

  const rootFolders = useDriveFolders();
  const currentFolder = useDriveFolder(currentFolderId);
  const syncFolder = useSyncFolder();
  const { data: excludedData } = useExcludedFolders();
  const excludeFolder = useExcludeFolder();
  const removeExclusion = useRemoveExclusion();
  const deleteBySubfolder = useDeleteInvoicesBySubfolder();
  const [deleteResult, setDeleteResult] = useState<{ deletedInvoices: number; deletedVendors: number } | null>(null);

  const excludedIds = new Set(excludedData?.folders.map((f) => f.drive_folder_id) ?? []);

  // Determinar trimestre desde el breadcrumb (primer nivel)
  const trimestre = breadcrumb.length >= 1 ? breadcrumb[0].name : null;

  const handleDeleteInvoices = async (folderName: string) => {
    if (!trimestre) return;
    if (!confirm(`Borrar todas las facturas de "${folderName}" en "${trimestre}"? Esto también eliminará vendors huérfanos.`)) return;
    const result = await deleteBySubfolder.mutateAsync({ trimestre, subfolder: folderName });
    setDeleteResult(result);
  };

  const navigateToFolder = (id: string, name: string) => {
    setBreadcrumb((prev) => [...prev, { id, name }]);
    setCurrentFolderId(id);
  };

  const navigateBack = () => {
    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);
    setCurrentFolderId(newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].id : null);
  };

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    setCurrentFolderId(newBreadcrumb[newBreadcrumb.length - 1].id);
  };

  const handleSync = async (folderId: string, folderName: string) => {
    // Determine trimestre and folder type from breadcrumb
    const trimestre = breadcrumb.length >= 1 ? breadcrumb[0].name : folderName;
    const folderType = breadcrumb.length >= 2 ? breadcrumb[1].name.toLowerCase() : folderName.toLowerCase();
    const subfolder = breadcrumb.length >= 3 ? folderName : undefined;

    setSyncingFolder(folderId);
    try {
      await syncFolder.mutateAsync({
        folderId,
        trimestre,
        folderType: folderType.includes("ingreso") ? "ingresos" : "gastos",
        subfolder,
      });
    } finally {
      setSyncingFolder(null);
    }
  };

  const files = currentFolderId ? currentFolder.data?.files : rootFolders.data?.folders;
  const isLoading = currentFolderId ? currentFolder.isLoading : rootFolders.isLoading;
  const error = currentFolderId ? currentFolder.error : rootFolders.error;

  const folders = files?.filter((f) => f.mimeType === FOLDER_MIME) ?? [];
  const pdfs = files?.filter((f) => f.mimeType !== FOLDER_MIME) ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Google Drive</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              rootFolders.refetch();
              currentFolder.refetch();
            }}
          >
            <RefreshCw className="mr-1 h-3 w-3" /> Actualizar
          </Button>
        </div>
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <button onClick={() => { setBreadcrumb([]); setCurrentFolderId(null); }} className="hover:text-zinc-900 dark:hover:text-zinc-100">
              Raíz
            </button>
            {breadcrumb.map((item, i) => (
              <span key={item.id} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {item.name}
                </button>
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-zinc-400">Cargando...</p>}
        {error && <p className="text-red-500">Error: {(error as Error).message}</p>}

        {!isLoading && !error && (
          <div className="space-y-1">
            {breadcrumb.length > 0 && (
              <button
                onClick={navigateBack}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            )}

            {folders.map((folder) => {
              const isExcluded = excludedIds.has(folder.id);
              return (
                <div key={folder.id} className={`flex items-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 ${isExcluded ? "opacity-50" : ""}`}>
                  <button
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm"
                  >
                    <Folder className={`h-4 w-4 shrink-0 ${isExcluded ? "text-zinc-400" : "text-blue-500"}`} />
                    <span className="truncate">{folder.name}</span>
                    {isExcluded && <Badge variant="secondary" className="shrink-0 text-[10px]">Excluida</Badge>}
                  </button>
                  <div className="flex shrink-0 items-center gap-1 pr-3">
                    {trimestre && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInvoices(folder.name)}
                        disabled={deleteBySubfolder.isPending}
                        title="Borrar facturas sincronizadas de esta carpeta"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    {isExcluded ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeExclusion.mutate(folder.id)}
                        disabled={removeExclusion.isPending}
                        title="Quitar exclusión"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Incluir
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => excludeFolder.mutate({ driveFolderId: folder.id, folderName: folder.name })}
                          disabled={excludeFolder.isPending}
                          title="Excluir de sincronización"
                        >
                          <EyeOff className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={syncingFolder === folder.id || syncFolder.isPending}
                          onClick={() => handleSync(folder.id, folder.name)}
                        >
                          {syncingFolder === folder.id ? (
                            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          ) : null}
                          Sincronizar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {pdfs.map((file) => (
              <div key={file.id} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-500">
                <FileText className="h-4 w-4 text-red-400" />
                {file.name}
              </div>
            ))}

            {folders.length === 0 && pdfs.length === 0 && (
              <p className="py-4 text-center text-zinc-400">Carpeta vacía</p>
            )}

            {deleteResult && (
              <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-950">
                <p className="text-sm font-medium">Facturas eliminadas: {deleteResult.deletedInvoices}, Vendors huérfanos eliminados: {deleteResult.deletedVendors}</p>
              </div>
            )}

            {syncFolder.data && syncingFolder === null && (
              <div className="mt-4 rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
                <p className="text-sm font-medium">Resultado de sincronización:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  {syncFolder.data.results.map((r, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Badge variant={r.status === "synced" ? "success" : r.status === "warning" ? "warning" : "destructive"} className="text-[10px]">
                        {r.status}
                      </Badge>
                      {r.fileName}
                      {r.message && <span className="text-zinc-400">— {r.message}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
