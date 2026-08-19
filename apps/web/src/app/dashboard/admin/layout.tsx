"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { AppIcon } from "@/components/ui/app-icon";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, ensureSession } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const isSuperAdmin = user?.roles?.includes("super_admin");
  const isSupport = user?.roles?.includes("support");

  useEffect(() => {
    if (!mounted) return;
    (async () => {
      const ok = await ensureSession();
      if (!ok) { router.push("/login"); return; }
      const u = useAuthStore.getState().user;
      const superAdmin = u?.roles?.includes("super_admin");
      const support = u?.roles?.includes("support");
      if (!superAdmin && !support) { router.push("/dashboard"); }
    })();
  }, [ensureSession, mounted, isAuthenticated, isSuperAdmin, isSupport, router]);

  if (!mounted || (!isSuperAdmin && !isSupport)) {
    return <div className="flex h-screen items-center justify-center"><p className="text-slate-500">Cargando...</p></div>;
  }

  return <>{children}</>;
}
