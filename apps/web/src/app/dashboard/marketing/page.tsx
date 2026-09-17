"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MarketingTabs } from "@/components/dashboard/marketing-tabs";
import SorteosPanel from "@/components/dashboard/sorteos-panel";
import LinktreesPanel from "@/components/dashboard/linktrees-panel";
import ReviewsPanel from "@/components/dashboard/reviews-panel";

const VALID_TABS = ["sorteos", "linktrees", "reviews"];

function MarketingContent() {
  const searchParams = useSearchParams();
  const tab = VALID_TABS.includes(searchParams.get("tab") || "") ? searchParams.get("tab") : "sorteos";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <MarketingTabs />
      {tab === "sorteos" && <SorteosPanel />}
      {tab === "linktrees" && <LinktreesPanel />}
      {tab === "reviews" && <ReviewsPanel />}
    </div>
  );
}

export default function MarketingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Cargando...</div>}>
      <MarketingContent />
    </Suspense>
  );
}