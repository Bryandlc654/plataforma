"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { AppIcon } from "@/components/ui/app-icon";
import { usePlatformBranding } from "@/components/providers/platform-branding-provider";
import { resolveBrandingLogo } from "@/lib/platform-branding";
import { useEffect, useState, Fragment } from "react";
import api from "@/lib/api";
import { cachedJson, setCachedJson } from "@/lib/cached-fetch";

function hasRole(user: any, role: string) { return user?.roles?.includes(role) || false; }
function hasPermission(user: any, perm: string) { return user?.permissions?.includes(perm) || hasRole(user, "super_admin"); }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, tenant, tenantId, isAuthenticated, hasHydrated, logout, selectTenant, ensureSession } = useAuthStore();
  const { branding } = usePlatformBranding();
  const platformLogo = resolveBrandingLogo(branding.logoUrl);
  const router = useRouter();
  const pathname = usePathname();
  const isSuperAdmin = hasRole(user, "super_admin");
  const isSupport = hasRole(user, "support");
  const isPlatformAdmin = hasRole(user, "platform_admin");
  const isPlatformStaff = isSuperAdmin || isSupport || isPlatformAdmin;
  const [collapsed, setCollapsed] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [gateChecked, setGateChecked] = useState(false);

  // El asistente /welcome solo se muestra justo después de registrarse (ver AuthFlow); aquí no se fuerza.
  // La cuenta de prueba muestra "La prueba termina en N días" hasta que haya un plan de pago.
  useEffect(() => {
    if (!hasHydrated) return;
    if (!tenantId || isPlatformStaff) { setGateChecked(true); return; }
    (async () => {
      try {
        const res: any = await api.get(`/tenants/${tenantId}/settings`);
        const data = res.data || res;
        const endsAt = data?.settings?.trial?.endsAt;
        setGateChecked(true);
        if (!endsAt) return setTrialDaysLeft(null);
        let paid = false;
        try {
          const s: any = await api.get("/subscriptions/current");
          const sub = s.data || s;
          paid = Number(sub?.plan?.price || 0) > 0 && sub?.status === "active";
        } catch {}
        if (paid) return setTrialDaysLeft(null);
        setTrialDaysLeft(Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000)));
      } catch { setGateChecked(true); }
    })();
  }, [hasHydrated, tenantId, isPlatformStaff, router]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; slug: string; isOwner: boolean }>>([]);
  const [capabilities, setCapabilities] = useState<{ bookings: boolean; ecommerce: boolean } | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    (async () => {
      const ok = await ensureSession();
      if (!ok) { router.push("/login"); return; }
      const u = useAuthStore.getState().user;
      if (!hasRole(u, "super_admin")) fetchTenants();
      // Si el estado persistido perdió el negocio activo (recarga), lo recuperamos del servidor.
      if (!hasRole(u, "super_admin") && !useAuthStore.getState().tenantId) {
        try {
          const res: any = await api.get("/users/tenants");
          const list = (res.data || res || []).filter((t: any) => t.isActive !== false);
          if (list[0]) selectTenant({ id: list[0].id, name: list[0].name, slug: list[0].slug, isOwner: list[0].isOwner });
        } catch {}
      }
    })();
  }, [ensureSession, hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!tenantId) return;
    const cacheKey = `capabilities:${tenantId}:v1`;
    const cached = cachedJson<{ bookings: boolean; ecommerce: boolean }>(cacheKey, 5 * 60 * 1000);
    if (cached) { setCapabilities(cached); return; }
    api.get("/sites/capabilities").then((res: any) => {
      const caps = res.data || res;
      setCapabilities(caps);
      setCachedJson(cacheKey, caps);
    }).catch(() => setCapabilities({ bookings: false, ecommerce: false }));
  }, [tenantId]);

  const fetchTenants = async () => {
    const cacheKey = "tenants:v1";
    const cached = cachedJson<Array<{ id: string; name: string; slug: string; isOwner: boolean }>>(cacheKey, 5 * 60 * 1000);
    if (cached) { setTenants(cached); return; }
    try {
      const res: any = await api.get("/users/tenants");
      const raw = res.data || res;
      const data = Array.isArray(raw)
        ? raw.filter((t: any) => t.isActive !== false)
        : [];
      setTenants(data);
      setCachedJson(cacheKey, data);
    }
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
        { href: "/dashboard/marketing", label: "Marketing", icon: "megaphone", perms: ["lead.read", "site.read"] },
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
        { href: "/dashboard/blog", label: "Blog", icon: "blog", perms: ["site.read"] },
        { href: "/dashboard/popups", label: "Popups", icon: "popups", perms: ["site.read"] },
      ]
    },
    {
      title: "Administración",
      links: [
        { href: "/dashboard/users", label: "Administración", icon: "shield", perms: ["user.read", "role.manage", "billing.read", "config.tenant", "audit.view"] },
        { href: "/dashboard/support", label: "Soporte", icon: "support", roles: "*" },
        { href: "/dashboard/help", label: "Base de Conocimientos", icon: "help", roles: "*" },
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
        { href: "/dashboard/admin/branding", label: "Marca de la plataforma", icon: "settings", platformAdmin: true },
        { href: "/dashboard/admin/knowledge-base", label: "Base de Conocimientos", icon: "help" },
        { href: "/dashboard/settings", label: "Configuración", icon: "settings" },
        { href: "/dashboard/support", label: "Soporte", icon: "support" },
        { href: "/dashboard/audit", label: "Auditoría", icon: "audit" },
      ]
    }
  ];

  if (!hasHydrated || !gateChecked) {
    return <div className="flex h-screen items-center justify-center bg-[var(--color-primary)]"><p className="text-white/60">Cargando...</p></div>;
  }

  const groups = (isPlatformStaff ? adminNavGroups : tenantNavGroups)
    .map((group) => ({
      ...group,
      links: group.links.filter((link: any) => {
        if (link.platformAdmin && !isSuperAdmin && !isPlatformAdmin) return false;
        if (isPlatformStaff) return true;
        if (link.roles === "*") return true;
        if (link.perms && !link.perms.some((p: string) => hasPermission(user, p))) return false;
        if (link.href === "/dashboard/bookings-page" && capabilities?.bookings !== true) return false;
        if (link.href === "/dashboard/ecommerce" && capabilities?.ecommerce !== true) return false;
        return true;
      }),
    }))
    .filter((g) => g.links.length > 0);

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname?.startsWith(href));

  return (
    <div className="flex min-h-screen bg-[var(--color-primary)]">
      <aside className={`relative ${collapsed ? "w-[68px]" : "w-[240px]"} flex flex-col text-[13px] text-white transition-all duration-200 ${collapsed ? "px-2" : "px-3"} py-3`}>
        {/* Brand + toggle */}
        <div className={`mb-3 flex items-center ${collapsed ? "justify-center" : "justify-between px-2"}`}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              {platformLogo ? (
                <span className="flex h-7 max-w-[150px] items-center rounded-md bg-white px-1.5 py-1">
                  <img src={platformLogo} alt="Logo de la plataforma" className="h-4 w-auto max-w-[130px] object-contain" />
                </span>
              ) : (
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-secondary)] text-sm font-black text-[var(--color-on-secondary)]">P</span>
                  <span className="font-semibold tracking-tight">Plataforma</span>
                </>
              )}
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white" title={collapsed ? "Abrir menú" : "Cerrar menú"}>
            <svg className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        </div>

        {/* Tenant selector */}
        {!isPlatformStaff && tenants.length > 1 && !collapsed && (
          <select value={tenantId || ""} onChange={(e) => { const t = tenants.find(x => x.id === e.target.value); if (t) handleSelectTenant(t); }} className="mb-3 w-full rounded-lg border-0 bg-white/10 px-2 py-1.5 text-[13px] text-white focus:ring-1 focus:ring-white/40">
            {tenants.map((t) => (<option key={t.id} value={t.id} className="text-black">{t.name}</option>))}
          </select>
        )}

        {/* Navigation */}
        <nav className="no-scrollbar flex-1 overflow-y-auto pb-4">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className={gIdx > 0 ? "mt-5" : ""}>
              {!collapsed && gIdx > 0 && (
                <h3 className="mb-1 px-2 text-[11px] font-medium text-white/45">{group.title}</h3>
              )}
              {collapsed && gIdx > 0 && <div className="mx-2 my-2 border-t border-white/10" />}
              <div className="space-y-0.5">
                {group.links.map((link: any) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={collapsed ? link.label : undefined}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 font-medium transition-colors ${collapsed ? "justify-center" : ""} ${isActive(link.href) ? "bg-white/15 text-white shadow-[inset_2px_0_0_var(--color-secondary)]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
                  >
                    <AppIcon name={link.icon} className="h-[18px] w-[18px] flex-shrink-0" />
                    {!collapsed && <span className="truncate">{link.label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {!isPlatformStaff && !tenant && !collapsed && (
            <Link href="/dashboard/new-tenant" className="mt-4 flex items-center gap-2 rounded-lg px-2 py-1.5 font-medium text-white/80 hover:bg-white/10">+ Crear negocio</Link>
          )}
        </nav>

        {/* Trial banner (estilo Shopify) */}
        {!collapsed && trialDaysLeft !== null && !isPlatformStaff && (
          <div className="mb-3 rounded-xl bg-gradient-to-b from-white/5 to-[rgba(var(--color-secondary-rgb),0.3)] p-3">
            <p className="mb-2 text-[13px] font-semibold">
              {trialDaysLeft > 0 ? `La prueba termina en ${trialDaysLeft} ${trialDaysLeft === 1 ? "día" : "días"}` : "Tu prueba terminó"}
            </p>
            <Link href="/dashboard/billing" className="block rounded-full bg-[var(--color-secondary)] py-2 text-center text-[13px] font-semibold text-[var(--color-on-secondary)] hover:bg-[var(--brand-secondary-hover)]">
              Elegir un plan
            </Link>
          </div>
        )}

        {/* User */}
        <div className={`border-t border-white/10 pt-3 ${collapsed ? "flex flex-col items-center gap-3" : ""}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? "" : "px-1"}`}>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--color-secondary)] text-xs font-bold text-[var(--color-on-secondary)]" title={user?.email}>
              {(user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{tenant?.name || user?.firstName || "Mi cuenta"}</p>
                <p className="truncate text-[11px] text-white/50">{user?.email}</p>
              </div>
            )}
          </div>
          {!collapsed ? (
            <div className="mt-2 flex gap-3 px-1 text-[12px] text-white/55">
              <Link href="/dashboard/profile" className="hover:text-white">Mi perfil</Link>
              <button onClick={logout} className="hover:text-red-400">Cerrar sesión</button>
            </div>
          ) : (
            <button onClick={logout} title="Cerrar sesión" className="text-white/50 hover:text-red-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1 p-0 lg:py-2 lg:pr-2">
        <div className="h-full min-h-screen overflow-auto bg-[#f1f1f1] lg:min-h-0 lg:rounded-xl lg:shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">{children}</div>
      </div>
    </div>
  );
}
