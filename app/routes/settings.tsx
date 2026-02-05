import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useSettings, useSaveSettings, useAuthStatus } from "~/hooks/use-invoices";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "~/lib/api";
import { Save, ExternalLink, CheckCircle, XCircle } from "lucide-react";

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const { data: settingsData, isLoading } = useSettings();
  const { data: authData } = useAuthStatus();
  const saveSettings = useSaveSettings();

  const [form, setForm] = useState({
    google_client_id: "",
    google_client_secret: "",
    drive_root_folder_id: "",
    lm_studio_url: "",
  });

  useEffect(() => {
    if (settingsData?.settings) {
      setForm({
        google_client_id: settingsData.settings.google_client_id || "",
        google_client_secret: settingsData.settings.google_client_secret || "",
        drive_root_folder_id: settingsData.settings.drive_root_folder_id || "",
        lm_studio_url: settingsData.settings.lm_studio_url || "",
      });
    }
  }, [settingsData]);

  const handleSave = () => {
    saveSettings.mutate(form);
  };

  const handleConnect = async () => {
    try {
      await api.post("/settings", form);
      const res = await api.get<{ url: string }>("/auth/login");
      window.location.href = res.url;
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const authResult = searchParams.get("auth");

  return (
    <div className="space-y-6 flex-1 min-h-0 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Configuración</h2>
        <p className="text-zinc-500">Configura las credenciales y conexiones</p>
      </div>

      {authResult === "success" && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Google Drive conectado correctamente.
        </div>
      )}
      {authResult === "error" && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          Error al conectar Google Drive: {searchParams.get("message")}
        </div>
      )}

      {isLoading && <p className="text-zinc-400">Cargando configuración...</p>}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Drive</CardTitle>
              <CardDescription>Credenciales OAuth para acceder a Google Drive</CardDescription>
            </div>
            {authData?.authenticated ? (
              <Badge variant="success">
                <CheckCircle className="mr-1 h-3 w-3" /> Conectado
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="mr-1 h-3 w-3" /> No conectado
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              value={form.google_client_id}
              onChange={(e) => setForm((f) => ({ ...f, google_client_id: e.target.value }))}
              placeholder="xxxx.apps.googleusercontent.com"
            />
          </div>
          <div>
            <Label htmlFor="client_secret">Client Secret</Label>
            <Input
              id="client_secret"
              type="password"
              value={form.google_client_secret}
              onChange={(e) => setForm((f) => ({ ...f, google_client_secret: e.target.value }))}
              placeholder="GOCSPX-..."
            />
          </div>
          <div>
            <Label htmlFor="root_folder">ID de carpeta raíz en Drive</Label>
            <Input
              id="root_folder"
              value={form.drive_root_folder_id}
              onChange={(e) => setForm((f) => ({ ...f, drive_root_folder_id: e.target.value }))}
              placeholder="1a2b3c4d5e..."
            />
            <p className="mt-1 text-xs text-zinc-400">
              La carpeta que contiene los trimestres (ej: "2025 - trimestre 1", etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConnect} disabled={!form.google_client_id || !form.google_client_secret}>
              <ExternalLink className="mr-1 h-4 w-4" /> Conectar Google Drive
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>LM Studio</CardTitle>
          <CardDescription>URL del servidor local de LM Studio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="lm_url">URL del servidor</Label>
            <Input
              id="lm_url"
              value={form.lm_studio_url}
              onChange={(e) => setForm((f) => ({ ...f, lm_studio_url: e.target.value }))}
              placeholder="http://localhost:1234/v1"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saveSettings.isPending}>
        <Save className="mr-1 h-4 w-4" />
        {saveSettings.isPending ? "Guardando..." : "Guardar configuración"}
      </Button>

      {saveSettings.isSuccess && (
        <p className="text-sm text-green-600">Configuración guardada correctamente</p>
      )}
    </div>
  );
}
