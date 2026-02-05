import { useTrimestres } from "~/hooks/use-invoices";
import { useFinancialSummary } from "~/hooks/use-movements";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Link } from "react-router";
import { FileText, CheckCircle, Clock, AlertTriangle, XCircle, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency } from "~/lib/utils";

export default function Home() {
  const { data, isLoading, error } = useTrimestres();
  const { data: summaryData } = useFinancialSummary();

  return (
    <div className="space-y-6 flex-1 min-h-0 overflow-auto">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Dashboard</h2>
        <p className="text-zinc-500">Resumen financiero</p>
      </div>

      {summaryData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Total Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summaryData.totals.ingresos)}</p>
              <p className="text-xs text-zinc-400 mt-1">
                Facturas: {formatCurrency(summaryData.invoices.ingresos)} | Movimientos: {formatCurrency(summaryData.movements.ingresos)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Total Gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summaryData.totals.gastos)}</p>
              <p className="text-xs text-zinc-400 mt-1">
                Facturas: {formatCurrency(summaryData.invoices.gastos)} | Movimientos: {formatCurrency(summaryData.movements.gastos)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-500" />
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${summaryData.totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(summaryData.totals.balance)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Ingresos - Gastos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading && <p className="text-zinc-400">Cargando...</p>}
      {error && <p className="text-red-500">Error al cargar datos</p>}

      {data?.trimestres.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-zinc-400">No hay facturas sincronizadas.</p>
            <p className="mt-1 text-sm text-zinc-400">
              Ve a <Link to="/drive" className="text-blue-500 hover:underline">Google Drive</Link> para sincronizar carpetas.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {data?.trimestres.map(({ trimestre, stats }) => {
          const totalAll = stats.reduce((sum, s) => sum + s.total, 0);
          const processedAll = stats.reduce((sum, s) => sum + s.processed, 0);
          const pendingAll = stats.reduce((sum, s) => sum + s.pending, 0);
          const warningsAll = stats.reduce((sum, s) => sum + s.warnings, 0);
          const errorsAll = stats.reduce((sum, s) => sum + s.errors, 0);

          const ingresosStats = stats.find((s) => s.folder_type === "ingresos");
          const gastosStats = stats.find((s) => s.folder_type === "gastos");

          return (
            <Link to={`/invoices/${encodeURIComponent(trimestre)}/gastos`} key={trimestre}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">{trimestre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-zinc-400" />
                      <span>{totalAll} facturas</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      {processedAll}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {pendingAll}
                    </div>
                    {warningsAll > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500">
                        <AlertTriangle className="h-3 w-3" />
                        {warningsAll}
                      </div>
                    )}
                    {errorsAll > 0 && (
                      <div className="flex items-center gap-1 text-red-500">
                        <XCircle className="h-3 w-3" />
                        {errorsAll}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                    <span>Ingresos: {ingresosStats?.total ?? 0}</span>
                    <span>Gastos: {gastosStats?.total ?? 0}</span>
                  </div>
                  {totalAll > 0 && (
                    <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${(processedAll / totalAll) * 100}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
