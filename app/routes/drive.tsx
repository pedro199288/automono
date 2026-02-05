import { DriveDashboard } from "~/components/DriveDashboard";
import { useAuthStatus } from "~/hooks/use-invoices";
import { Card, CardContent } from "~/components/ui/card";
import { Link } from "react-router";

export default function DrivePage() {
  const { data: authData, isLoading } = useAuthStatus();

  return (
    <div className="space-y-6 flex-1 min-h-0 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Google Drive</h2>
        <p className="text-zinc-500">Navega y sincroniza carpetas de facturas</p>
      </div>

      {isLoading && <p className="text-zinc-400">Verificando autenticacion...</p>}

      {authData && !authData.authenticated && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-zinc-500">No estas conectado a Google Drive.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Ve a{" "}
              <Link to="/settings" className="text-blue-500 hover:underline">
                Configuracion
              </Link>{" "}
              para conectar tu cuenta.
            </p>
          </CardContent>
        </Card>
      )}

      {authData?.authenticated && <DriveDashboard />}
    </div>
  );
}
