"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const TABS = [
  { href: "/dashboard/users", label: "Usuarios", perm: "user.read" },
  { href: "/dashboard/roles", label: "Roles y permisos", perm: "role.manage" },
  { href: "/dashboard/billing", label: "Facturación", perm: "billing.read" },
  { href: "/dashboard/settings", label: "Configuración", perm: "config.tenant" },
  { href: "/dashboard/audit", label: "Auditoría", perm: "audit.view" },
];

export function AdminModuleTabs({ className = "mb-6" }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isSuper = user?.roles?.includes("super_admin");
  const tabs = TABS.filter((t) => isSuper || user?.permissions?.includes(t.perm));

  return (
    <nav className={`flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 ${className}`}>
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active ? "bg-primary-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}