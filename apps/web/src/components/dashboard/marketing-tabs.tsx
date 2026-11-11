"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export const MARKETING_TABS = [
  { value: "sorteos", label: "Sorteos" },
  { value: "linktrees", label: "Bio Links" },
  { value: "reviews", label: "Reseñas" },
];

export function MarketingTabs({ className = "mb-6" }: { className?: string }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "sorteos";

  return (
    <nav className={`flex flex-wrap gap-1 rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] bg-white p-1 ${className}`}>
      {MARKETING_TABS.map((t) => {
        const active = activeTab === t.value;
        return (
          <Link
            key={t.value}
            href={`/dashboard/marketing?tab=${t.value}`}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active ? "bg-primary-600 text-white shadow-sm" : "text-[#616161] hover:bg-[#f1f1f1] hover:text-[#303030]"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}