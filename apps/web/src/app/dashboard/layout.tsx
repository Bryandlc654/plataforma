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
  const [search, setSearch] = useState("");
  const [userMenu, setUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // en pantallas pequeñas el menú es un cajón
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
        if (!endsAt) {
          setTrialDaysLeft(null);
          setTrialExpired(false);
          return;
        }
        let paid = false;
        try {
          const s: any = await api.get("/subscriptions/current");
          const sub = s.data || s;
          const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).getTime() : 0;
          paid =
            Number(sub?.plan?.price || 0) > 0 &&
            sub?.status === "active" &&
            periodEnd > Date.now();
        } catch {}
        if (paid) {
          setTrialDaysLeft(null);
          setTrialExpired(false);
          return;
        }
        const daysLeft = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86400000));
        setTrialDaysLeft(daysLeft);
        setTrialExpired(daysLeft <= 0);
      } catch {
        setTrialExpired(false);
      } finally {
        setGateChecked(true);
      }
    })();
  }, [hasHydrated, tenantId, isPlatformStaff, router]);

  useEffect(() => {
    if (!trialExpired || isPlatformStaff) return;
    if (pathname?.startsWith("/dashboard/billing")) return;
    router.replace("/dashboard/billing?trial=expired");
  }, [trialExpired, isPlatformStaff, pathname, router]);
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

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 650));
    logout();
  };

  // Agrupación para Clientes (Tenant)
  const tenantNavGroups = [
    {
      title: "General",
      links: [
        { href: "/dashboard", label: "Inicio", icon: "home", roles: "*" },
        { href: "/dashboard/sites", label: "Sitios Web", icon: "sites", perms: ["site.read"] },
        { href: "/dashboard/domains", label: "Dominios", icon: "globe", perms: ["site.read"] },
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
        { href: "/dashboard/users", label: "Equipo y permisos", icon: "shield", perms: ["user.read", "role.manage", "billing.read", "config.tenant", "audit.view"] },
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
        { href: "/dashboard/admin/branding", label: "Marca de la plataforma", icon: "settings", platformAdmin: true },
        { href: "/dashboard/admin/payments", label: "Pagos de la plataforma", icon: "billing", platformAdmin: true },
        { href: "/dashboard/admin/knowledge-base", label: "Base de Conocimientos", icon: "help" },
        { href: "/dashboard/settings", label: "Configuración", icon: "settings" },
        { href: "/dashboard/support", label: "Soporte", icon: "support" },
        { href: "/dashboard/audit", label: "Auditoría", icon: "audit" },
      ]
    }
  ];

  if (!hasHydrated || !gateChecked) {
    return <div className="flex h-screen items-center justify-center bg-[#f1f1f1]"><span className="h-8 w-8 animate-spin rounded-full border-2 border-black/10 border-t-[var(--color-primary)]" /></div>;
  }

  if (trialExpired && !isPlatformStaff && !pathname?.startsWith("/dashboard/billing")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#f1f1f1] px-4 text-center">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-black/10 border-t-[var(--color-primary)]" />
        <p className="text-[13px] text-[#616161]">Tu prueba terminó. Redirigiendo a facturación...</p>
      </div>
    );
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

  const allLinks = groups.flatMap((g) => g.links as any[]);
  const results = search.trim()
    ? allLinks.filter((l) => l.label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(search.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""))).slice(0, 8)
    : [];
  const initials = (user?.firstName?.[0] || user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-[#f1f1f1]">
      {/* Barra superior (como el admin de Shopify) */}
      <header className="sticky top-0 z-40 flex h-14 flex-shrink-0 items-center gap-3 bg-[#1a1a1a] px-3 text-white sm:px-4">
        <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 lg:hidden">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2 lg:w-[220px]">
          {platformLogo ? (
            <img src={platformLogo} alt="Logo de la plataforma" className="h-7 w-auto max-w-[150px] object-contain" />
          ) : (
            <>
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-secondary)] text-sm font-black text-[var(--color-on-secondary)]">P</span>
              <span className="font-semibold tracking-tight">Plataforma</span>
            </>
          )}
        </Link>

        {/* Buscador: lleva a cualquier sección del panel */}
        <div className="relative mx-auto hidden w-full max-w-[480px] sm:block">
          <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" /></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) { router.push(results[0].href); setSearch(""); }
              if (e.key === "Escape") setSearch("");
            }}
            placeholder="Buscar"
            className="h-8 w-full rounded-lg border border-white/15 bg-[#303030] pl-8 pr-3 text-[13px] text-white placeholder:text-white/50 focus:border-white/40 focus:bg-[#3a3a3a] focus:outline-none"
          />
          {results.length > 0 && (
            <ul className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-xl bg-white py-1 text-[#303030] shadow-[0_8px_24px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.08)]">
              {results.map((r) => (
                <li key={r.href}>
                  <button onMouseDown={(e) => { e.preventDefault(); router.push(r.href); setSearch(""); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] hover:bg-[#f1f1f1]">
                    <AppIcon name={r.icon} className="h-4 w-4 text-[#616161]" />{r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {trialDaysLeft !== null && !isPlatformStaff && (
            <Link href="/dashboard/billing" className="hidden rounded-lg bg-white/10 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-white/15 md:block">
              {trialDaysLeft > 0 ? `Prueba: ${trialDaysLeft} ${trialDaysLeft === 1 ? "día" : "días"}` : "Prueba terminada"}
            </Link>
          )}
          <div className="relative">
            <button onClick={() => setUserMenu((v) => !v)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-white/10">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-secondary)] text-[12px] font-bold text-[var(--color-on-secondary)]">{initials}</span>
              <span className="hidden max-w-[160px] truncate text-[13px] font-medium md:block">{tenant?.name || user?.firstName || "Mi cuenta"}</span>
            </button>
            {userMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl bg-white py-1 text-[#303030] shadow-[0_8px_24px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.08)]">
                  <div className="border-b border-[#ebebeb] px-3 py-2.5">
                    <p className="truncate text-[13px] font-semibold">{user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Mi cuenta"}</p>
                    <p className="truncate text-[12px] text-[#616161]">{user?.email}</p>
                  </div>
                  {!isPlatformStaff && tenants.length > 1 && (
                    <div className="border-b border-[#ebebeb] py-1">
                      <p className="px-3 pb-1 pt-1.5 text-[12px] font-medium text-[#616161]">Negocios</p>
                      {tenants.map((t) => (
                        <button key={t.id} onClick={() => { handleSelectTenant(t); setUserMenu(false); }} className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] hover:bg-[#f1f1f1] ${t.id === tenantId ? "font-semibold" : ""}`}>
                          <span className="truncate">{t.name}</span>
                          {t.id === tenantId && <span className="text-[color:var(--color-primary)]">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  <Link href="/dashboard/profile" onClick={() => setUserMenu(false)} className="block px-3 py-1.5 text-[13px] hover:bg-[#f1f1f1]">Mi perfil</Link>
                  {!isPlatformStaff && <Link href="/dashboard/billing" onClick={() => setUserMenu(false)} className="block px-3 py-1.5 text-[13px] hover:bg-[#f1f1f1]">Plan y facturación</Link>}
                  <button onClick={handleLogout} className="block w-full px-3 py-1.5 text-left text-[13px] text-[#c70a24] hover:bg-[#fff1f0]">Cerrar sesión</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}
        {/* Barra lateral clara (como Shopify) */}
        <aside className={`fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col bg-[#ebebeb] transition-transform lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <nav className="no-scrollbar flex-1 overflow-y-auto px-2 py-3">
            {groups.map((group, gIdx) => (
              <div key={gIdx} className={gIdx > 0 ? "mt-4" : ""}>
                {gIdx > 0 && <h3 className="mb-1 flex items-center px-2 text-[12px] font-semibold text-[#616161]">{group.title}</h3>}
                <div className="space-y-px">
                  {group.links.map((link: any) => {
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-2 rounded-lg px-2 py-[5px] text-[13px] font-semibold transition-colors ${active ? "bg-white text-[#303030] shadow-[0_1px_0_rgba(0,0,0,0.07),0_0_0_1px_rgba(0,0,0,0.04)]" : "text-[#303030] hover:bg-[#f1f1f1]"}`}
                      >
                        <AppIcon name={link.icon} className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-[#303030]" : "text-[#4a4a4a]"}`} />
                        <span className="truncate">{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {!isPlatformStaff && !tenant && (
              <Link href="/dashboard/new-tenant" className="mt-4 flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-[#303030] hover:bg-[#f1f1f1]">+ Crear negocio</Link>
            )}
          </nav>

          {/* Banner de prueba (estilo Shopify) */}
          {trialDaysLeft !== null && !isPlatformStaff && (
            <div className="m-2 rounded-xl bg-white p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)]">
              <p className="text-[13px] font-semibold text-[#303030]">
                {trialDaysLeft > 0 ? `La prueba termina en ${trialDaysLeft} ${trialDaysLeft === 1 ? "día" : "días"}` : "Tu prueba terminó"}
              </p>
              <p className="mt-0.5 text-[12px] text-[#616161]">Elige un plan para seguir vendiendo.</p>
              <Link href="/dashboard/billing" className="btn-primary mt-2 w-full">Elegir un plan</Link>
            </div>
          )}

          {!isPlatformStaff && hasPermission(user, "config.tenant") && (
            <div className="border-t border-[#d4d4d4] px-2 py-2">
              <Link href="/dashboard/settings" className={`flex items-center gap-2 rounded-lg px-2 py-[5px] text-[13px] font-semibold text-[#303030] ${isActive("/dashboard/settings") ? "bg-white" : "hover:bg-[#f1f1f1]"}`}>
                <AppIcon name="settings" className="h-[18px] w-[18px] text-[#4a4a4a]" />Configuración
              </Link>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {loggingOut && (
        <div role="status" aria-live="polite" className="logout-overlay fixed inset-0 z-[200] flex items-center justify-center bg-[#f1f1f1]">
          <div className="logout-card flex flex-col items-center gap-4 text-[#303030]">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-[var(--color-primary)]" />
            <p className="text-[13px] font-medium text-[#616161]">Cerrando sesión...</p>
          </div>
        </div>
      )}
    </div>
  );
}
