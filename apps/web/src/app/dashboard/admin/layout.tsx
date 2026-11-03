"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AppIcon } from "@/components/ui/app-icon";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hasHydrated, ensureSession } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isSuperAdmin = user?.roles?.includes("super_admin");
  const isSupport = user?.roles?.includes("support");
  const isPlatformAdmin = user?.roles?.includes("platform_admin");
  const isPlatformStaff = isSuperAdmin || isSupport || isPlatformAdmin;

  useEffect(() => {
    if (!mounted || !hasHydrated) return;
    (async () => {
      const ok = await ensureSession();
      if (!ok) { router.push("/login"); return; }
      const u = useAuthStore.getState().user;
      const platformStaff =
        u?.roles?.includes("super_admin") ||
        u?.roles?.includes("support") ||
        u?.roles?.includes("platform_admin");
      if (!platformStaff) { router.push("/dashboard"); }
    })();
  }, [ensureSession, hasHydrated, mounted, isAuthenticated, isPlatformStaff, router]);

  if (!mounted || !hasHydrated || !isPlatformStaff) {
    return <div className="flex h-screen items-center justify-center"><p className="text-slate-500">Cargando...</p></div>;
  }

  return <>{children}</>;
}
