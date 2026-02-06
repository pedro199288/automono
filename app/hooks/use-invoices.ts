import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { InvoiceWithVendor, VendorRow, TrimestreStats, ExcludedFolderRow, ProjectRow } from "~/lib/types";

export function useTrimestres() {
  return useQuery({
    queryKey: ["trimestres"],
    queryFn: () => api.get<{ trimestres: TrimestreStats[] }>("/invoices/trimestres"),
  });
}

export function useInvoices(trimestre: string | null, folderType?: string) {
  return useQuery({
    queryKey: ["invoices", trimestre, folderType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (trimestre) params.set("trimestre", trimestre);
      if (folderType) params.set("type", folderType);
      return api.get<{ invoices: InvoiceWithVendor[] }>(`/invoices?${params}`);
    },
    enabled: !!trimestre,
  });
}

export function useInvoicesByType(folderType: string) {
  return useQuery({
    queryKey: ["invoices", folderType],
    queryFn: () => api.get<{ invoices: InvoiceWithVendor[] }>(`/invoices?type=${folderType}`),
    enabled: !!folderType,
  });
}

export function useInvoice(id: number | null) {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: () => api.get<{ invoice: InvoiceWithVendor }>(`/invoices/${id}`),
    enabled: id !== null,
  });
}

export function useProcessInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => api.post<{ ok: boolean; data?: Record<string, unknown> }>("/invoices/process", { invoiceId }),
    onSuccess: (_data, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["trimestres"] });
    },
  });
}

export function useProcessBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceIds: number[]) =>
      api.post<{ results: Array<{ id: number; status: string; error?: string }> }>("/invoices/process-batch", { invoiceIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["trimestres"] });
    },
  });
}

export function useProcessBatchSequential() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState({ total: 0, completed: 0, currentId: null as number | null, errors: [] as Array<{ id: number; error: string }>, isProcessing: false });

  const process = useCallback(async (invoiceIds: number[]) => {
    setProgress({ total: invoiceIds.length, completed: 0, currentId: null, errors: [], isProcessing: true });
    const errors: Array<{ id: number; error: string }> = [];

    for (let i = 0; i < invoiceIds.length; i++) {
      const id = invoiceIds[i];
      setProgress((prev) => ({ ...prev, currentId: id, completed: i }));
      try {
        await api.post("/invoices/process", { invoiceId: id });
      } catch (err) {
        errors.push({ id, error: err instanceof Error ? err.message : "Unknown error" });
      }
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }

    await queryClient.invalidateQueries({ queryKey: ["trimestres"] });
    setProgress((prev) => ({ ...prev, completed: invoiceIds.length, currentId: null, errors, isProcessing: false }));
  }, [queryClient]);

  return { process, progress };
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, extracted_data }: { id: number; extracted_data: string }) =>
      api.patch<{ ok: boolean }>(`/invoices/${id}`, { extracted_data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: boolean }>(`/vendors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
    },
  });
}

export function useVendors(type?: string) {
  return useQuery({
    queryKey: ["vendors", type],
    queryFn: () => {
      const params = type ? `?type=${type}` : "";
      return api.get<{ vendors: VendorRow[] }>(`/vendors${params}`);
    },
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { raw_name: string; type?: string }) =>
      api.post<{ vendor: VendorRow }>("/vendors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
}

export function useAssignVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, vendorId, vendorField }: { invoiceId: number; vendorId: string | null; vendorField?: string }) =>
      api.patch<{ ok: boolean }>(`/invoices/${invoiceId}/vendor`, { vendor_id: vendorId, vendor_field: vendorField }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
    },
  });
}

export function useSyncTrimestre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { folderId: string; trimestre: string }) =>
      api.post<{ results: Array<{ fileName: string; status: string; message?: string }>; synced: number; errors: number }>("/drive/sync-trimestre", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["trimestres"] });
      queryClient.invalidateQueries({ queryKey: ["drive-sync-status"] });
    },
  });
}

export function useScanTrimestre(folderId: string | null, trimestre: string | null) {
  return useQuery({
    queryKey: ["drive-sync-status", folderId, trimestre],
    queryFn: () =>
      api.get<{ driveFiles: number; dbFiles: number; fullySynced: boolean }>(
        `/drive/scan-trimestre?folderId=${folderId}&trimestre=${encodeURIComponent(trimestre!)}`
      ),
    enabled: !!folderId && !!trimestre,
    staleTime: 60_000,
  });
}

interface SyncAllProgress {
  total: number;
  completed: number;
  currentTrimestre: string | null;
  results: Array<{ trimestre: string; synced: number; errors: number }>;
  isSyncing: boolean;
}

export function useSyncAllTrimestres() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<SyncAllProgress>({
    total: 0, completed: 0, currentTrimestre: null, results: [], isSyncing: false,
  });

  const syncAll = useCallback(async (folders: Array<{ id: string; name: string }>) => {
    setProgress({ total: folders.length, completed: 0, currentTrimestre: null, results: [], isSyncing: true });

    const results: SyncAllProgress["results"] = [];

    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      setProgress((prev) => ({ ...prev, currentTrimestre: folder.name, completed: i }));

      try {
        const res = await api.post<{ synced: number; errors: number }>("/drive/sync-trimestre", {
          folderId: folder.id,
          trimestre: folder.name,
        });
        results.push({ trimestre: folder.name, synced: res.synced, errors: res.errors });
      } catch (err) {
        results.push({ trimestre: folder.name, synced: 0, errors: -1 });
      }

      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["trimestres"] });
      setProgress((prev) => ({ ...prev, results: [...results] }));
    }

    await queryClient.invalidateQueries({ queryKey: ["drive-sync-status"] });
    setProgress((prev) => ({ ...prev, completed: folders.length, currentTrimestre: null, isSyncing: false }));
  }, [queryClient]);

  return { syncAll, progress };
}

export function useSyncFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { folderId: string; trimestre: string; folderType: string; subfolder?: string }) =>
      api.post<{ results: Array<{ fileName: string; status: string; message?: string }> }>("/drive/sync", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["trimestres"] });
    },
  });
}

export function useDriveFolders() {
  return useQuery({
    queryKey: ["drive-folders"],
    queryFn: () => api.get<{ folders: Array<{ id: string; name: string; mimeType: string }> }>("/drive/folders"),
  });
}

export function useDriveFolder(folderId: string | null) {
  return useQuery({
    queryKey: ["drive-folder", folderId],
    queryFn: () => api.get<{ files: Array<{ id: string; name: string; mimeType: string }> }>(`/drive/folder?id=${folderId}`),
    enabled: !!folderId,
  });
}

export function useAuthStatus() {
  return useQuery({
    queryKey: ["auth-status"],
    queryFn: () => api.get<{ authenticated: boolean }>("/auth/status"),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<{ settings: Record<string, string> }>("/settings"),
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, string>) => api.post<{ ok: boolean }>("/settings", settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

// Excluded folders
export function useExcludedFolders() {
  return useQuery({
    queryKey: ["excluded-folders"],
    queryFn: () => api.get<{ folders: ExcludedFolderRow[] }>("/drive/excluded"),
  });
}

export function useExcludeFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { driveFolderId: string; folderName: string }) =>
      api.post<{ ok: boolean }>("/drive/exclude", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excluded-folders"] });
      queryClient.invalidateQueries({ queryKey: ["drive-sync-status"] });
    },
  });
}

export function useRemoveExclusion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (driveFolderId: string) =>
      api.delete<{ ok: boolean }>(`/drive/exclude/${encodeURIComponent(driveFolderId)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["excluded-folders"] });
      queryClient.invalidateQueries({ queryKey: ["drive-sync-status"] });
    },
  });
}

export function useDeleteInvoicesBySubfolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { trimestre: string; subfolder: string }) =>
      api.delete<{ deletedInvoices: number; deletedVendors: number }>("/invoices/by-subfolder", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["trimestres"] });
      queryClient.invalidateQueries({ queryKey: ["drive-sync-status"] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      return res.json() as Promise<{ success: boolean; deleted: boolean; deletedVendor: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
      queryClient.invalidateQueries({ queryKey: ["trimestres"] });
    },
  });
}

// Projects
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => api.get<{ projects: ProjectRow[] }>("/projects"),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.post<{ project: ProjectRow }>("/projects", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useAssignProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, projectId }: { invoiceId: number; projectId: string | null }) =>
      api.patch<{ ok: boolean }>(`/invoices/${invoiceId}/project`, { project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice"] });
    },
  });
}
