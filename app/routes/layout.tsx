import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Home,
  FileText,
  FolderOpen,
  Users,
  UserCheck,
  Settings,
  PanelLeftClose,
  Wallet,
  LayoutList,
} from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/records", icon: LayoutList, label: "Registros" },
  { to: "/invoices", icon: FileText, label: "Facturas" },
  { to: "/movements", icon: Wallet, label: "Movimientos" },
  { to: "/drive", icon: FolderOpen, label: "Google Drive" },
  { to: "/vendors", icon: Users, label: "Proveedores" },
  { to: "/clients", icon: UserCheck, label: "Clientes" },
  { to: "/settings", icon: Settings, label: "Configuracion" },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen bg-white dark:bg-zinc-950">
        <aside
          className={`flex flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 transition-[width] duration-200 ${
            collapsed ? "w-14" : "w-56"
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-3">
            {collapsed ? (
              <button
                onClick={() => setCollapsed(false)}
                className="mx-auto p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Expandir sidebar"
              >
                <img src="/automono.svg" alt="Automono" className="h-7 w-7" />
              </button>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <img src="/automono.svg" alt="Automono" className="h-7 w-7" />
                  <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate">
                    Automono
                  </h1>
                </div>
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-1.5 rounded-md text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                  title="Colapsar sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-md text-sm font-medium transition-colors ${
                    collapsed ? "justify-center p-2" : "gap-2 px-3 py-2"
                  } ${
                    isActive
                      ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
          {!collapsed && (
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-xs text-zinc-400">
                Contabilidad para autónomos
              </p>
            </div>
          )}
        </aside>
        <main className="flex-1 overflow-hidden p-6 flex flex-col">
          <div className="mx-auto max-w-screen-2xl flex-1 min-h-0 flex flex-col w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}
