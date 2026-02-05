import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "~/lib/api";
import type { MovementWithVendor } from "~/lib/types";
import type { FinancialSummary } from "../../server/db/queries";

export function useMovements(type?: "ingresos" | "gastos", trimestre?: string) {
  return useQuery({
    queryKey: ["movements", type, trimestre],
    queryFn: () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (trimestre) params.set("trimestre", trimestre);
      const query = params.toString();
      return api.get<{ movements: MovementWithVendor[] }>(`/movements${query ? `?${query}` : ""}`);
    },
  });
}

export function useMovement(id: number | null) {
  return useQuery({
    queryKey: ["movement", id],
    queryFn: () => api.get<{ movement: MovementWithVendor }>(`/movements/${id}`),
    enabled: id !== null,
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      type: "ingresos" | "gastos";
      category: string;
      date: string;
      description: string;
      amount: number;
      tax_base?: number | null;
      vat_rate?: number | null;
      vat_amount?: number | null;
      currency?: string;
      trimestre: string;
      reference?: string | null;
      vendor_id?: string | null;
      notes?: string | null;
    }) => api.post<{ movement: MovementWithVendor }>("/movements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["movement-trimestres"] });
    },
  });
}

export function useUpdateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<{
      type: "ingresos" | "gastos";
      category: string;
      date: string;
      description: string;
      amount: number;
      tax_base: number | null;
      vat_rate: number | null;
      vat_amount: number | null;
      currency: string;
      trimestre: string;
      reference: string | null;
      vendor_id: string | null;
      notes: string | null;
    }>) => api.patch<{ movement: MovementWithVendor }>(`/movements/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["movement"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
    },
  });
}

export function useDeleteMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<{ ok: boolean }>(`/movements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      queryClient.invalidateQueries({ queryKey: ["movement-trimestres"] });
    },
  });
}

export function useMovementTrimestres() {
  return useQuery({
    queryKey: ["movement-trimestres"],
    queryFn: () => api.get<{ trimestres: string[] }>("/movements/trimestres"),
  });
}

export function useFinancialSummary(trimestre?: string) {
  return useQuery({
    queryKey: ["financial-summary", trimestre],
    queryFn: () => {
      const query = trimestre ? `?trimestre=${encodeURIComponent(trimestre)}` : "";
      return api.get<FinancialSummary>(`/reports/summary${query}`);
    },
  });
}
