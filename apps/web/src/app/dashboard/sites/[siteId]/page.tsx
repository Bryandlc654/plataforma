"use client";

import { useParams } from "next/navigation";
import { SiteEditor } from "@/components/editor/site-editor";

export default function SiteEditorPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  return <SiteEditor siteId={siteId} />;
}
