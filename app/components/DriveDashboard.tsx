import { useState } from "react";
import {
  useDriveFolders,
  useTrimestres,
  useSyncTrimestre,
  useScanTrimestre,
  useSyncAllTrimestres,
  useExcludedFolders,
  useRemoveExclusion,
} from "~/hooks/use-invoices";
import { FolderBrowser } from "./FolderBrowser";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import type { TrimestreStats } from "~/lib/types";
import {
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  FolderSync,
  EyeOff,
  X,
} from "lucide-react";

// --- SyncOverviewBar ---
function SyncOverviewBar({
  totalTrimestres,
  totalInvoices,
  unsyncedCount,
  onSyncAll,
  isSyncing,
  progress,
}: {
  totalTrimestres: number;
  totalInvoices: number;
  unsyncedCount: number;
  onSyncAll: () => void;
  isSyncing: boolean;
  progress: { completed: number; total: number };
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 py-4">
        <div className="flex items-center gap-2 text-sm">
          <FolderSync className="h-4 w-4 text-zinc-400" />
          <span className="font-medium">{totalTrimestres} trimestres</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-zinc-400" />
          <span>{totalInvoices} facturas sincronizadas</span>
        </div>
        {unsyncedCount > 0 && (
          <Badge variant="warning">{unsyncedCount} sin sincronizar</Badge>
        )}
        <div className="ml-auto">
          <Button onClick={onSyncAll} disabled={isSyncing || totalTrimestres === 0} size="sm">
            {isSyncing ? (
              <>
                <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                {progress.completed}/{progress.total}
              </>
            ) : (
              <>
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Sincronizar todo
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- SyncProgressPanel ---
function SyncProgressPanel({
  progress,
}: {
  progress: {
    total: number;
    completed: number;
    currentTrimestre: string | null;
    results: Array<{ trimestre: string; synced: number; errors: number }>;
    isSyncing: boolean;
  };
}) {
  if (!progress.isSyncing && progress.results.length === 0) return null;

  const pct = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {progress.isSyncing
              ? `Sincronizando: ${progress.currentTrimestre ?? "..."}`
              : "Sincronización completada"}
          </span>
          <span className="text-zinc-500">
            {progress.completed}/{progress.total}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {progress.results.length > 0 && (
          <ul className="space-y-1 text-xs text-zinc-500">
            {progress.results.map((r) => (
              <li key={r.trimestre} className="flex items-center gap-2">
                {r.errors === -1 ? (
                  <XCircle className="h-3 w-3 text-red-500" />
                ) : r.errors > 0 ? (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                <span>{r.trimestre}</span>
                {r.errors === -1 ? (
                  <span className="text-red-500">Error de conexion</span>
                ) : (
                  <span>
                    {r.synced} sincronizadas
                    {r.errors > 0 && `, ${r.errors} errores`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// --- TrimestreCard ---
function TrimestreCard({
  folder,
  stats,
  isSyncingAll,
}: {
  folder: { id: string; name: string };
  stats: TrimestreStats | undefined;
  isSyncingAll: boolean;
}) {
  const syncTrimestre = useSyncTrimestre();
  const [scanEnabled, setScanEnabled] = useState(false);
  const scanResult = useScanTrimestre(
    scanEnabled ? folder.id : null,
    scanEnabled ? folder.name : null
  );

  const isSyncing = syncTrimestre.isPending;
  const hasStats = stats && stats.stats.length > 0;

  const totalAll = hasStats ? stats.stats.reduce((s, x) => s + x.total, 0) : 0;
  const processedAll = hasStats ? stats.stats.reduce((s, x) => s + x.processed, 0) : 0;
  const pendingAll = hasStats ? stats.stats.reduce((s, x) => s + x.pending, 0) : 0;
  const warningsAll = hasStats ? stats.stats.reduce((s, x) => s + x.warnings, 0) : 0;
  const errorsAll = hasStats ? stats.stats.reduce((s, x) => s + x.errors, 0) : 0;
  const ingresosStats = stats?.stats.find((s) => s.folder_type === "ingresos");
  const gastosStats = stats?.stats.find((s) => s.folder_type === "gastos");

  const handleSync = () => {
    syncTrimestre.mutate({ folderId: folder.id, trimestre: folder.name });
  };

  const handleScan = () => {
    setScanEnabled(true);
    scanResult.refetch();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{folder.name}</CardTitle>
          {hasStats ? (
            <Badge variant="success">{totalAll} facturas</Badge>
          ) : (
            <Badge variant="secondary">Sin sincronizar</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasStats && (
          <TooltipProvider>
            <div className="flex items-center gap-3 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-green-600 cursor-help">
                    <CheckCircle className="h-3 w-3" />
                    {processedAll}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Facturas procesadas</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-zinc-400 cursor-help">
                    <Clock className="h-3 w-3" />
                    {pendingAll}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Facturas pendientes de procesar</p>
                </TooltipContent>
              </Tooltip>
              {warningsAll > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-yellow-500 cursor-help">
                      <AlertTriangle className="h-3 w-3" />
                      {warningsAll}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Facturas con advertencias</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {errorsAll > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-red-500 cursor-help">
                      <XCircle className="h-3 w-3" />
                      {errorsAll}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Facturas con errores</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex gap-4 text-xs text-zinc-500">
              <span>Ingresos: {ingresosStats?.total ?? 0}</span>
              <span>Gastos: {gastosStats?.total ?? 0}</span>
            </div>
            {totalAll > 0 && (
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-1.5 rounded-full bg-green-500"
                  style={{ width: `${(processedAll / totalAll) * 100}%` }}
                />
              </div>
            )}
          </TooltipProvider>
        )}

        {/* Scan result */}
        {scanResult.data && (
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-900">
            {scanResult.data.dbFiles}/{scanResult.data.driveFiles} archivos sincronizados
            {scanResult.data.fullySynced ? (
              <CheckCircle className="ml-1.5 inline h-3 w-3 text-green-500" />
            ) : (
              <AlertTriangle className="ml-1.5 inline h-3 w-3 text-yellow-500" />
            )}
          </div>
        )}

        {/* Sync result inline */}
        {syncTrimestre.data && !isSyncing && (
          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs dark:bg-zinc-900">
            {syncTrimestre.data.synced} sincronizadas
            {syncTrimestre.data.errors > 0 && `, ${syncTrimestre.data.errors} errores`}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSyncing || isSyncingAll}
            onClick={handleSync}
            className="flex-1"
          >
            {isSyncing ? (
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3 w-3" />
            )}
            Sincronizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={scanResult.isFetching}
            onClick={handleScan}
          >
            {scanResult.isFetching ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- ExcludedFoldersPanel ---
function ExcludedFoldersPanel() {
  const { data: excludedData, isLoading } = useExcludedFolders();
  const removeExclusion = useRemoveExclusion();

  const folders = excludedData?.folders ?? [];
  if (isLoading || folders.length === 0) return null;

  return (
    <details className="group">
      <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-2">
        <EyeOff className="h-3.5 w-3.5" />
        Carpetas excluidas ({folders.length})
      </summary>
      <Card className="mt-2">
        <CardContent className="py-3">
          <ul className="space-y-1">
            {folders.map((f) => (
              <li key={f.drive_folder_id} className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                <span className="text-zinc-500">{f.folder_name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExclusion.mutate(f.drive_folder_id)}
                  disabled={removeExclusion.isPending}
                  title="Quitar exclusión"
                >
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </details>
  );
}

// --- DriveDashboard (main) ---
export function DriveDashboard() {
  const { data: foldersData, isLoading: foldersLoading } = useDriveFolders();
  const { data: trimestresData, isLoading: trimestresLoading } = useTrimestres();
  const { syncAll, progress } = useSyncAllTrimestres();

  const folders = foldersData?.folders ?? [];
  const trimestresStats = trimestresData?.trimestres ?? [];

  // Build a lookup map: trimestre name -> stats
  const statsMap = new Map<string, TrimestreStats>();
  for (const ts of trimestresStats) {
    statsMap.set(ts.trimestre, ts);
  }

  const totalInvoices = trimestresStats.reduce(
    (sum, t) => sum + t.stats.reduce((s, x) => s + x.total, 0),
    0
  );
  const unsyncedCount = folders.filter((f) => !statsMap.has(f.name)).length;

  const handleSyncAll = () => {
    syncAll(folders);
  };

  if (foldersLoading || trimestresLoading) {
    return <p className="text-zinc-400">Cargando...</p>;
  }

  return (
    <div className="space-y-4">
      <FolderBrowser />

      <ExcludedFoldersPanel />

      <SyncOverviewBar
        totalTrimestres={folders.length}
        totalInvoices={totalInvoices}
        unsyncedCount={unsyncedCount}
        onSyncAll={handleSyncAll}
        isSyncing={progress.isSyncing}
        progress={progress}
      />

      <SyncProgressPanel progress={progress} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <TrimestreCard
            key={folder.id}
            folder={folder}
            stats={statsMap.get(folder.name)}
            isSyncingAll={progress.isSyncing}
          />
        ))}
      </div>

      {folders.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-zinc-400">No se encontraron carpetas de trimestre en Drive.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Verifica que la carpeta raiz esta configurada correctamente.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
