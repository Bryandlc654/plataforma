"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";

interface BillingData {
  metrics: { mrr: number; monthRevenue: number; totalInvoices: number; paidInvoices: number; pendingInvoices: number; activeSubscriptions: number };
  byStatus: Array<{ status: string; count: number }>;
  plans: Array<{ name: string; slug: string; price: number; currency: string; tenants: number; subscriptions: number }>;
  recentInvoices: Array<{ id: string; amount: number; currency: string; status: string; paidAt: string; createdAt: string; tenant: { name: string; slug: string } }>;
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try { const res: any = await api.get("/dashboard/admin/billing"); setData(res.data || res); }
    catch {} finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Cargando facturación...</p>
        </div>
      </div>
);
  }

  if (!data) return null;

  return (
    <div className="p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Facturación Global</h1>
        <p className="text-sm text-slate-500 mt-1">Métricas financieras de toda la plataforma</p>
      </div>

      {/* Revenue metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">MRR</p>
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(data.metrics.mrr)}</p>
          <p className="text-xs text-slate-400 mt-1">Ingreso recurrente mensual</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Revenue (mes)</p>
            <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-primary-700">{formatCurrency(data.metrics.monthRevenue)}</p>
          <p className="text-xs text-slate-400 mt-1">Facturado este mes</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suscripciones</p>
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700">{data.metrics.activeSubscriptions}</p>
          <p className="text-xs text-slate-400 mt-1">Suscripciones activas</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Facturas</p>
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-700">{data.metrics.paidInvoices}<span className="text-sm font-normal text-slate-400">/{data.metrics.totalInvoices}</span></p>
          <p className="text-xs text-slate-400 mt-1">{data.metrics.pendingInvoices} pendientes</p>
        </div>
      </div>

      {/* Plans breakdown */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Tenants por plan</h3>
          <div className="space-y-3">
            {data.plans.map((p) => (
              <div key={p.slug} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                    <span className="text-sm text-slate-500">{p.tenants} tenants</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      p.slug === "free" ? "bg-slate-400" :
                      p.slug === "pro" ? "bg-primary-500" : "bg-purple-500"
                    }`}
                      style={{ width: `${Math.max(5, data.plans.reduce((m, x) => Math.max(m, x.tenants), 1) ? (p.tenants / Math.max(1, data.plans.reduce((m, x) => Math.max(m, x.tenants), 0))) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500 w-16 text-right">{formatCurrency(p.price, p.currency || "USD")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Estado de suscripciones</h3>
          <div className="space-y-3">
            {data.byStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    s.status === "active" ? "bg-green-500" :
                    s.status === "canceled" ? "bg-red-500" :
                    s.status === "suspended" ? "bg-amber-500" : "bg-slate-400"
                  }`} />
                  <span className="text-sm text-slate-600 capitalize">{s.status}</span>
                </div>
                <span className="text-sm font-medium text-slate-700">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent invoices */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Facturas recientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Tenant</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentInvoices.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-sm">Sin facturas registradas</td></tr>
              ) : (
                data.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">{inv.tenant?.name || "—"}</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(inv.amount, inv.currency || "USD")}</td>
                    <td className="py-3 px-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        inv.status === "paid" ? "bg-green-50 text-green-700" :
                        inv.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                      }`}>{inv.status === "paid" ? "Pagado" : inv.status === "pending" ? "Pendiente" : inv.status}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(inv.createdAt)}</td>
                    <td className="py-3 px-4 text-slate-500 text-xs">{inv.paidAt ? formatDate(inv.paidAt) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
);
}
