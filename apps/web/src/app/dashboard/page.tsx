"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import api from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AppIcon } from "@/components/ui/app-icon";

interface TenantStats {
  summary: { totalSites: number; totalLeads: number; totalUsers: number; leadsLast30Days: number };
  subscription: { plan: { name: string; slug: string; price: number }; currentPeriodEnd: string; status: string } | null;
  recentLeads: Array<{ id: string; name: string; email: string; status: string; createdAt: string }>;
  recentActivity: Array<{ id: string; action: string; resource: string; user: string; createdAt: string }>;
}

interface AdminStats {
  summary: {
    totalTenants: number; activeTenants: number; suspendedTenants: number;
    totalUsers: number; activeSubscriptions: number;
    totalLeads: number; totalSites: number;
    mrr: number; churnRate: number;
    totalRevenue: number; monthRevenue: number;
  };
  recentTenants: Array<{ id: string; name: string; slug: string; isActive: boolean; createdAt: string; plan: { name: string } | null; _count: { userTenants: number; sites: number } }>;
}

function hasRole(user: any, role: string) {
  return user?.roles?.includes(role) || false;
}

function hasPermission(user: any, perm: string) {
  return user?.permissions?.includes(perm) || hasRole(user, "super_admin");
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, tenant, tenantId, isAuthenticated, logout, selectTenant, isLoading, ensureSession } = useAuthStore();
  const [tenantData, setTenantData] = useState<TenantStats | null>(null);
  const [adminData, setAdminData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string; isOwner: boolean; roles: string[] }> | null>(null);
  const [error, setError] = useState("");

  const isSuperAdmin = hasRole(user, "super_admin");
  const isSupport = hasRole(user, "support");

  const fetchTenants = useCallback(async () => {
    try {
      const res: any = await api.get("/users/tenants");
      setTenants(res.data || res);
    } catch { setTenants([]); }
  }, []);

  const fetchTenantDashboard = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/dashboard/tenant/${tenantId}`);
      setTenantData(res.data || res);
    } catch (err: any) {
      if (err.response?.status === 403) setError("No tienes acceso a este negocio");
      setTenantData(null);
    } finally { setLoading(false); }
  }, [tenantId]);

  const fetchAdminDashboard = useCallback(async () => {
    try {
      const res: any = await api.get("/dashboard/admin");
      setAdminData(res.data || res);
    } catch { setAdminData(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await ensureSession();
      if (!ok) { router.push("/login"); return; }
      const u = useAuthStore.getState().user;
      const superAdmin = hasRole(u, "super_admin");
      if (superAdmin) { fetchAdminDashboard(); fetchTenants(); setLoading(false); }
      else if (tenantId) { fetchTenantDashboard(); fetchTenants(); }
      else { setLoading(false); }
    })();
  }, [ensureSession, fetchAdminDashboard, fetchTenants, fetchTenantDashboard, isAuthenticated, tenantId, router]);

  const handleSelectTenant = (t: any) => {
    selectTenant({ id: t.id, name: t.name, slug: t.slug, isOwner: t.isOwner });
  };

  const navLinks = [
    { href: "/dashboard", label: "Inicio", icon: "home", roles: "*" },
    { href: "/dashboard/sites", label: "Sitios", icon: "sites", perms: ["site.read"] },
    { href: "/dashboard/media", label: "Media", icon: "media", perms: ["site.read"] },
    { href: "/dashboard/leads", label: "Leads", icon: "leads", perms: ["lead.read"] },
    { href: "/dashboard/analytics", label: "Analytics", icon: "analytics", perms: ["analytics.view"] },
    { href: "/dashboard/seo", label: "SEO", icon: "seo", perms: ["site.read"] },
    { href: "/dashboard/users", label: "Usuarios", icon: "users", perms: ["user.read"] },
    { href: "/dashboard/audit", label: "Auditoría", icon: "audit", perms: ["audit.view"] },
    { href: "/dashboard/settings", label: "Configuración", icon: "settings", perms: ["config.tenant"] },
    { href: "/dashboard/whatsapp", label: "WhatsApp", icon: "whatsapp", perms: ["integration.manage"] },
    { href: "/dashboard/billing", label: "Facturación", icon: "billing", perms: ["billing.read"] },
    { href: "/dashboard/webhooks", label: "Webhooks", icon: "webhooks", perms: ["integration.manage"] },
    { href: "/dashboard/api-keys", label: "API Keys", icon: "apikeys", perms: ["integration.manage"] },
    { href: "/dashboard/automations", label: "Automatizaciones", icon: "automations", perms: ["integration.manage"] },
    { href: "/dashboard/ai", label: "IA Tools", icon: "ai", perms: ["site.read"] },
    { href: "/dashboard/ecommerce", label: "E-commerce", icon: "ecommerce", perms: ["site.read"] },
    { href: "/dashboard/bookings-page", label: "Reservas", icon: "bookings", perms: ["site.read"] },
    { href: "/dashboard/support", label: "Soporte", icon: "support", roles: "*" },
  ];

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  ];

  if (isLoading || loading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-slate-500">Cargando...</div></div>;
  }

  return (
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        {/* SUPER ADMIN VIEW */}
        {isSuperAdmin && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div><h1 className="text-2xl font-bold text-slate-900">Dashboard Global</h1><p className="text-sm text-slate-500 mt-1">Administración de la plataforma SaaS</p></div>
              <div className="flex gap-2">
                <Link href="/dashboard/admin/tenants" className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg> Gestionar tenants</Link>
                <Link href="/dashboard/admin/users" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg> Usuarios</Link>
                <Link href="/dashboard/admin/billing" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> Facturación</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-slate-500 uppercase">Tenants</p><div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center"><svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg></div></div>
                <p className="text-2xl font-bold text-primary-700">{adminData?.summary?.totalTenants ?? 0}<span className="text-xs font-normal text-green-600 ml-1">{adminData?.summary?.activeTenants ?? 0} activos</span></p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-slate-500 uppercase">Usuarios</p><div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg></div></div>
                <p className="text-2xl font-bold text-blue-700">{adminData?.summary?.totalUsers ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-slate-500 uppercase">MRR</p><div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center"><svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(adminData?.summary?.mrr ?? 0)}</p>
                <p className="text-xs text-slate-400 mt-1">Churn: {adminData?.summary?.churnRate ?? 0}%</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-slate-500 uppercase">Revenue</p><div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center"><svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div></div>
                <p className="text-2xl font-bold text-purple-700">{formatCurrency(adminData?.summary?.totalRevenue ?? 0)}</p>
                <p className="text-xs text-slate-400 mt-1">{formatCurrency(adminData?.summary?.monthRevenue ?? 0)} este mes</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Suscripciones</p><p className="text-xl font-bold text-primary-700">{adminData?.summary?.activeSubscriptions ?? 0}</p></div>
              <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Leads totales</p><p className="text-xl font-bold text-amber-700">{adminData?.summary?.totalLeads ?? 0}</p></div>
              <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Sitios</p><p className="text-xl font-bold text-cyan-700">{adminData?.summary?.totalSites ?? 0}</p></div>
              <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs text-slate-500">Suspendidos</p><p className="text-xl font-bold text-red-700">{adminData?.summary?.suspendedTenants ?? 0}</p></div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-slate-900">Tenants recientes</h3><Link href="/dashboard/admin/tenants" className="text-xs font-medium text-primary-600 hover:text-primary-700">Ver todos →</Link></div>
              {adminData?.recentTenants && adminData.recentTenants.length > 0 ? (
                <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 text-slate-600">Nombre</th><th className="text-left py-2 px-3 text-slate-600">Plan</th><th className="text-left py-2 px-3 text-slate-600">Usuarios</th><th className="text-left py-2 px-3 text-slate-600">Sitios</th><th className="text-left py-2 px-3 text-slate-600">Estado</th><th className="text-left py-2 px-3 text-slate-600">Fecha</th></tr></thead>
                  <tbody>{adminData.recentTenants.map((t) => (<tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="py-2 px-3 font-medium">{t.name}</td><td className="py-2 px-3 text-xs text-slate-500">{t.plan?.name||"Free"}</td><td className="py-2 px-3">{t._count.userTenants}</td><td className="py-2 px-3">{t._count.sites}</td><td className="py-2 px-3"><span className={`rounded-full px-2 py-0.5 text-xs ${t.isActive?"bg-green-50 text-green-700":"bg-red-50 text-red-700"}`}>{t.isActive?"Activo":"Inactivo"}</span></td><td className="py-2 px-3 text-slate-500 text-xs">{formatDate(t.createdAt)}</td></tr>))}</tbody></table></div>
              ) : <p className="text-sm text-slate-500">No hay tenants</p>}
            </div>
          </>
        )}

        {/* TENANT USER VIEW */}
        {!isSuperAdmin && (
          <>
            {error && <div className="card bg-red-50 border-red-200 mb-6"><p className="text-sm text-red-700">{error}</p></div>}

            {tenant ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
                    <p className="mt-1 text-sm text-slate-600">
                      {tenant.isOwner ? "Propietario" : "Miembro"}
                      {tenantData?.subscription ? ` · Plan ${tenantData.subscription.plan.name}` : " · Plan Free"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/dashboard/sites/new" className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-700 transition-colors shadow-sm">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg> Nuevo sitio
                    </Link>
                    <Link href="/dashboard/leads" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> Leads
                    </Link>
                    <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg> Ajustes
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push("/dashboard/sites")}>
                    <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sitios</p><div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors"><svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg></div></div>
                    <p className="text-3xl font-bold text-primary-700">{tenantData?.summary?.totalSites ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">sitios creados</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push("/dashboard/leads")}>
                    <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Leads totales</p><div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg></div></div>
                    <p className="text-3xl font-bold text-blue-700">{tenantData?.summary?.totalLeads ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1"><span className="text-green-600 font-medium">+{tenantData?.summary?.leadsLast30Days ?? 0}</span> últimos 30 días</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push("/dashboard/leads")}>
                    <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Conversión</p><div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors"><svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div></div>
                    <p className="text-3xl font-bold text-green-700">{tenantData?.summary ? Math.round((tenantData.summary.leadsLast30Days / Math.max(1, tenantData.summary.totalLeads)) * 100) : 0}%</p>
                    <p className="text-xs text-slate-400 mt-1">tasa de conversión</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => router.push("/dashboard/users")}>
                    <div className="flex items-center justify-between mb-3"><p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Usuarios</p><div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors"><svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg></div></div>
                    <p className="text-3xl font-bold text-purple-700">{tenantData?.summary?.totalUsers ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">miembros del equipo</p>
                  </div>
                </div>

                {tenantData?.recentLeads && tenantData.recentLeads.length > 0 && (
                  <div className="card mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900">Leads recientes</h3>
                      <Link href="/dashboard/leads" className="text-xs font-medium text-primary-600 hover:text-primary-700">Ver todos →</Link>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-3 text-slate-600">Nombre</th><th className="text-left py-2 px-3 text-slate-600">Email</th><th className="text-left py-2 px-3 text-slate-600">Estado</th><th className="text-left py-2 px-3 text-slate-600">Fecha</th></tr></thead>
                      <tbody>{tenantData.recentLeads.map((lead) => (<tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="py-2 px-3">{lead.name || "-"}</td><td className="py-2 px-3">{lead.email || "-"}</td><td className="py-2 px-3"><span className={`rounded-full px-2 py-0.5 text-xs ${lead.status==="new"?"bg-blue-50 text-blue-700":lead.status==="contacted"?"bg-yellow-50 text-yellow-700":lead.status==="converted"?"bg-green-50 text-green-700":"bg-slate-50 text-slate-700"}`}>{lead.status}</span></td><td className="py-2 px-3 text-slate-500 text-xs">{formatDate(lead.createdAt)}</td></tr>))}</tbody>
                    </table>
                    </div>
                  </div>
                )}

                {tenantData?.recentActivity && tenantData.recentActivity.length > 0 && (
                  <div className="card">
                    <h3 className="font-semibold text-slate-900 mb-4">Actividad reciente</h3>
                    <div className="space-y-3">
                      {tenantData.recentActivity.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 text-sm">
                          <div className="h-2 w-2 rounded-full bg-primary-400 flex-shrink-0" />
                          <div className="flex-1"><span className="text-slate-700">{a.user}</span><span className="text-slate-500"> · {a.action} {a.resource}</span></div>
                          <span className="text-slate-400 text-xs">{formatDate(a.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Sin negocio</h2>
                  <p className="text-sm text-slate-600 mb-6">Selecciona o crea un negocio</p>
                  <Link href="/dashboard/new-tenant" className="btn-primary">Crear negocio</Link>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    );
}
