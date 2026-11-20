import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, Nunito, Playfair_Display } from "next/font/google";
import { resolveApiBaseUrl } from "@/lib/api-config";
import { MenuApp, type PublicMenu } from "./menu-app";

// Tipografías de las plantillas (Urbano/Galería, Bistró y Café).
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500", "700", "800"], variable: "--font-bricolage" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-playfair" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700", "800"], variable: "--font-nunito" });

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
    <div className={`${bricolage.variable} ${playfair.variable} ${nunito.variable}`}>
      <MenuApp slug={slug} initial={menu} />
    </div>
  );
}
