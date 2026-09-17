"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SorteosPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/marketing?tab=sorteos"); }, [router]);
  return <div className="p-6 text-slate-500">Redirigiendo...</div>;
}