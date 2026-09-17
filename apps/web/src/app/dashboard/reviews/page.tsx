"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReviewsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/dashboard/marketing?tab=reviews"); }, [router]);
  return <div className="p-6 text-slate-500">Redirigiendo...</div>;
}