import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";
import { resolveApiBaseUrl } from "@/lib/api-config";
import { MenuApp, type PublicMenu } from "./menu-app";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-menu" });

async function fetchMenu(slug: string): Promise<PublicMenu | null> {
  const apiBase = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  try {
    const res = await fetch(`${apiBase}/food/public/${encodeURIComponent(slug)}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as PublicMenu;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const menu = await fetchMenu(slug);
  if (!menu) return { title: { absolute: "Menú no encontrado" } };
  const r = menu.restaurant;
  const description = r.tagline || r.description || `Mira el menú de ${r.name} y haz tu pedido en línea.`;
  return {
    title: { absolute: `${r.name} · Menú` },
    description,
    icons: r.logoUrl ? { icon: r.logoUrl } : undefined,
    openGraph: { title: `${r.name} · Menú`, description, images: r.coverUrl || r.logoUrl ? [r.coverUrl || r.logoUrl!] : undefined },
  };
}

export default async function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await fetchMenu(slug);
  if (!menu) notFound();
  return (
    <div className={display.variable}>
      <MenuApp slug={slug} initial={menu} />
    </div>
  );
}
