"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate } from "@/lib/utils";

interface LogEntry {
  id: string; action: string; resource: string; resourceId: string;
  metadata: any; ipAddress: string; userAgent: string; createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string } | null;
  tenant: { id: string; name: string } | null;
}

export default function AuditPage() {
  const { user, tenantId } = useAuthStore();
  const isAdmin = user?.roles?.includes("super_admin") || user?.roles?.includes("support");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actions, setActions] = useState<Array<{ action: string; count: number }>>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filter) params.action = filter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const url = isAdmin ? "/audit/global" : "/audit";
      const [logRes, actRes]: any[] = await Promise.all([
        api.get(url, { params }),
        api.get("/audit/actions"),
      ]);
      setLogs(logRes.data?.items || logRes.items || []);
      setActions(actRes.data || actRes);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo, filter, isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const actionLabel = (action: string) => {
    const labels: Record<string, string> = {
      "user.register": "Registro de usuario", "user.login": "Inicio de sesión",
      "user.invited": "Usuario invitado", "tenant.create": "Creación de negocio",
      "site.create": "Creación de sitio", "site.publish": "Publicación de sitio",
      "subscription.upgrade": "Cambio de plan", "subscription.cancel": "Cancelación",
      "invitation.created": "Invitación creada", "invitation.accepted": "Invitación aceptada",
    };
    return labels[action] || action;
  };

  if (loading) return <div className="p-8 text-slate-500">Cargando...</div>;

  return (
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Auditoría</h1>
        <p className="text-sm text-slate-600 mb-6">{logs.length} registros {isAdmin ? "(global)" : ""}</p>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs text-slate-500">Fechas:</span>
          <input type="date" className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-xs text-slate-400">a</span>
          <input type="date" className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          {(dateFrom || dateTo) && <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs text-red-500 hover:text-red-700">Limpiar</button>}
        </div>

        {/* Action filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilter("")} className={`rounded-full px-3 py-1 text-xs font-medium ${!filter ? "bg-primary-50 text-primary-700" : "bg-slate-100 text-slate-600"}`}>
            Todos
          </button>
          {actions.map((a) => (
            <button key={a.action} onClick={() => setFilter(a.action)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filter === a.action ? "bg-primary-50 text-primary-700" : "bg-slate-100 text-slate-600"}`}>
              {actionLabel(a.action)} ({a.count})
            </button>
          ))}
        </div>

        {/* Log table */}
        <div className="card overflow-x-auto">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Sin registros de auditoría</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">Acción</th>
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">Usuario</th>
                  {isAdmin && <th className="text-left py-2 px-3 text-slate-600 font-medium">Tenant</th>}
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">Recurso</th>
                  <th className="text-left py-2 px-3 text-slate-600 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{actionLabel(log.action)}</span>
                    </td>
                    <td className="py-2 px-3">{log.user ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim() || log.user.email : "Sistema"}</td>
                    {isAdmin && <td className="py-2 px-3 text-slate-500 text-xs">{log.tenant?.name || "-"}</td>}
                    <td className="py-2 px-3 text-slate-500 text-xs">{log.resource}</td>
                    <td className="py-2 px-3 text-slate-500 text-xs">{formatDate(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    );
}
