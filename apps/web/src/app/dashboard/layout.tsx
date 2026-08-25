"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { AppIcon } from "@/components/ui/app-icon";
import { useEffect, useState, Fragment } from "react";
import api from "@/lib/api";

function hasRole(user: any, role: string) { return user?.roles?.includes(role) || false; }
function hasPermission(user: any, perm: string) { return user?.permissions?.includes(perm) || hasRole(user, "super_admin"); }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tenant, tenantId, isAuthenticated, logout, selectTenant, ensureSession } = useAuthStore();
  const router = useRouter();
  const isSuperAdmin = hasRole(user, "super_admin");
  const isSupport = hasRole(user, "support");
  const [collapsed, setCollapsed] = useState(false);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string; isOwner: boolean }>>([]);
  const [capabilities, setCapabilities] = useState<{ bookings: boolean; ecommerce: boolean } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    (async () => {
      const ok = await ensureSession();
      if (!ok) { router.push("/login"); return; }
      const u = useAuthStore.getState().user;
      if (!hasRole(u, "super_admin")) fetchTenants();
    })();
  }, [ensureSession, isAuthenticated, router]);

  useEffect(() => {
    if (!tenantId) return;
    api.get("/sites/capabilities").then((res: any) => setCapabilities(res.data || res)).catch(() => setCapabilities({ bookings: false, ecommerce: false }));
  }, [tenantId]);

  const fetchTenants = async () => {
    try { const res: any = await api.get("/users/tenants"); setTenants(res.data || res); }
    catch { setTenants([]); }
  };

  const handleSelectTenant = (t: any) => selectTenant({ id: t.id, name: t.name, slug: t.slug, isOwner: t.isOwner });

  // Agrupación para Clientes (Tenant)
  const tenantNavGroups = [
    {
      title: "General",
      links: [
        { href: "/dashboard", label: "Inicio", icon: "home", roles: "*" },
        { href: "/dashboard/sites", label: "Sitios Web", icon: "sites", perms: ["site.read"] },
        { href: "/dashboard/media", label: "Archivos Media", icon: "media", perms: ["site.read"] },
        { href: "/dashboard/app-download", label: "App Movil", icon: "appdownload", perms: ["site.read"] },
      ]
    },
    {
      title: "Ventas y Marketing",
      links: [
        { href: "/dashboard/leads", label: "Leads", icon: "leads", perms: ["lead.read"] },
        { href: "/dashboard/sorteos", label: "Sorteos", icon: "leads", perms: ["lead.read"] },
        { href: "/dashboard/linktrees", label: "Bio Links", icon: "leads", perms: ["site.read"] },
        { href: "/dashboard/reviews", label: "Reseñas", icon: "support", perms: ["site.read"] },
        { href: "/dashboard/bookings-page", label: "Reservas", icon: "bookings", perms: ["site.read"] },
        { href: "/dashboard/ecommerce", label: "E-commerce", icon: "ecommerce", perms: ["site.read"] },
        { href: "/dashboard/whatsapp", label: "WhatsApp", icon: "whatsapp", perms: ["integration.manage"] },
      ]
    },
    {
      title: "Crecimiento",
      links: [
        { href: "/dashboard/analytics", label: "Analytics", icon: "analytics", perms: ["analytics.view"] },
        { href: "/dashboard/seo", label: "SEO", icon: "seo", perms: ["site.read"] },
      ]
    },
    {
      title: "Administración",
      links: [
        { href: "/dashboard/users", label: "Usuarios", icon: "users", perms: ["user.read"] },
        { href: "/dashboard/billing", label: "Facturación", icon: "billing", perms: ["billing.read"] },
        { href: "/dashboard/settings", label: "Configuración", icon: "settings", perms: ["config.tenant"] },
        { href: "/dashboard/audit", label: "Auditoría", icon: "audit", perms: ["audit.view"] },
        { href: "/dashboard/support", label: "Soporte", icon: "support", roles: "*" },
      ]
    }
  ];

  // Agrupación para Super Admin
  const adminNavGroups = [
      {
        title: "Gestión Core",
        links: [
          { href: "/dashboard", label: "Dashboard Global", icon: "home" },
          { href: "/dashboard/admin/tenants", label: "Tenants", icon: "admintenants" },
          { href: "/dashboard/admin/users", label: "Usuarios", icon: "adminusers" },
          { href: "/dashboard/admin/plans", label: "Planes", icon: "adminplans" },
          { href: "/dashboard/admin/billing", label: "Facturación", icon: "billing" },
          { href: "/dashboard/app-download", label: "App Movil", icon: "appdownload" },
        ]
      },
    {
      title: "Configuración",
      links: [
        { href: "/dashboard/admin/templates", label: "Plantillas", icon: "admintemplates" },
        { href: "/dashboard/settings", label: "Configuración", icon: "settings" },
        { href: "/dashboard/support", label: "Soporte", icon: "support" },
        { href: "/dashboard/audit", label: "Auditoría", icon: "audit" },
      ]
    }
  ];

  return (
    <div className="flex min-h-screen">
      <aside className={`relative ${collapsed ? "w-16" : "w-64"} border-r border-slate-200 bg-white flex flex-col transition-all duration-200 ${collapsed ? "p-2" : "p-6"}`}>
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-4 top-6 h-8 w-8 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all z-10"
          title={collapsed ? "Abrir menú" : "Cerrar menú"}
        >
          <svg className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Brand */}
        <div className={`flex items-center ${collapsed ? "justify-center" : "px-2"} mb-8`}>
          {collapsed ? (
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">I</div>
          ) : (
            <Image src="/logo.png" alt="Build Iceberg Agency" width={220} height={64} className="h-10 w-auto object-contain" />
          )}
        </div>

        {/* Tenant selector */}
        {!isSuperAdmin && !isSupport && tenants.length > 0 && !collapsed && (
          <div className="mb-6">
            <select value={tenantId || ""} onChange={(e) => { const t = tenants.find(x => x.id === e.target.value); if (t) handleSelectTenant(t); }} className="input-field text-sm">
              {tenants.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav className={`space-y-1 flex-1 overflow-y-auto no-scrollbar pb-4 ${collapsed ? "space-y-2" : "space-y-1"}`}>
          {isSuperAdmin || isSupport ? (
            adminNavGroups.map((group, gIdx) => (
              <div key={gIdx} className={gIdx > 0 ? "mt-6" : ""}>
                {!collapsed && (
                  <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </h3>
                )}
                {collapsed && gIdx > 0 && <div className="border-t border-slate-100 my-2 mx-2"></div>}
                <div className="space-y-1">
                  {group.links.map(link => (
                    <Link key={link.href} href={link.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors ${collapsed ? "justify-center" : ""}`} title={collapsed ? link.label : undefined}>
                      <AppIcon name={link.icon} className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{link.label}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            tenantNavGroups.map((group, gIdx) => {
              // Filter links based on roles/perms
              const allowedLinks = group.links.filter(link => {
                if (link.roles === "*") return true;
                if (link.perms && !link.perms.some(p => hasPermission(user, p))) return false;
                if (link.href === "/dashboard/bookings-page" && capabilities?.bookings !== true) return false;
                if (link.href === "/dashboard/ecommerce" && capabilities?.ecommerce !== true) return false;
                return true;
              });
              
              if (allowedLinks.length === 0) return null;

              return (
                <div key={gIdx} className={gIdx > 0 ? "mt-6" : ""}>
                  {!collapsed && (
                    <h3 className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {group.title}
                    </h3>
                  )}
                  {collapsed && gIdx > 0 && <div className="border-t border-slate-100 my-2 mx-2"></div>}
                  <div className="space-y-1">
                    {allowedLinks.map(link => (
                      <Link key={link.href} href={link.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors ${collapsed ? "justify-center" : ""}`} title={collapsed ? link.label : undefined}>
                        <AppIcon name={link.icon} className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>{link.label}</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })
          )}
          
          {!isSuperAdmin && !tenant && !collapsed && (
            <Link href="/dashboard/new-tenant" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 font-medium mt-4">+ Crear negocio</Link>
          )}
        </nav>

        {/* User section */}
        {!collapsed && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="mb-3 px-3">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                isSuperAdmin ? "bg-purple-50 text-purple-700" : hasRole(user, "owner") ? "bg-blue-50 text-blue-700" :
                hasRole(user, "admin") ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700"
              }`}>{isSuperAdmin ? "Super Admin" : user?.roles?.[0] || "Usuario"}</span>
            </div>
            <div className="flex items-center gap-3 px-1">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm flex-shrink-0">{user?.firstName?.[0] || "U"}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="mt-3 w-full text-left text-xs text-slate-500 hover:text-red-600 transition-colors px-1">Cerrar sesión</button>
          </div>
        )}
        {collapsed && (
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-xs flex-shrink-0" title={`${user?.firstName} ${user?.lastName}`}>{user?.firstName?.[0] || "U"}</div>
            <button onClick={logout} title="Cerrar sesión" className="text-slate-400 hover:text-red-500 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        )}
      </aside>

      <div className="flex-1 bg-slate-50 overflow-auto">{children}</div>
    </div>
  );
}
