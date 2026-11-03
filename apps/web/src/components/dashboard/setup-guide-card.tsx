"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface SiteLite { id: string; name: string; domain: string | null; isPublished: boolean; customized?: boolean; }

/** Guía de pendientes del inicio: lleva al cliente de la plantilla a tener su sitio publicado con dominio. */
export function SetupGuideCard() {
  const [site, setSite] = useState<SiteLite | null>(null);

  useEffect(() => {
    api.get("/sites")
      .then((res: any) => {
        const items = ((res.data?.items || res.items || []) as SiteLite[]);
        // El primer sitio al que todavía le falte algo.
        setSite(items.find((s) => !s.customized || !s.domain || !s.isPublished) || null);
      })
      .catch(() => setSite(null));
  }, []);

  if (!site) return null;

  const steps = [
    { id: "template", label: "Elegiste tu plantilla", done: true },
    { id: "customize", label: "Personaliza tu sitio", hint: "Cambia textos e imágenes con un clic.", done: !!site.customized, href: `/dashboard/sites/${site.id}`, cta: "Abrir el editor" },
    { id: "domain", label: "Conecta tu dominio", hint: "Busca tu dirección propia; la conectamos por ti.", done: !!site.domain, href: "/dashboard/domains", cta: "Buscar dominio" },
    { id: "publish", label: "Publica tu sitio", hint: "Para que tus clientes puedan verlo.", done: site.isPublished, href: `/dashboard/sites/${site.id}`, cta: "Ir a publicar" },
  ];
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Deja <span className="text-[color:var(--color-primary)]">{site.name}</span> listo</h2>
          <p className="text-sm text-slate-500">{done} de {steps.length} pasos completados</p>
        </div>
        {next && next.href && (
          <Link href={next.href} className="mt-2 inline-flex w-fit items-center rounded-lg bg-gradient-to-b from-[color:color-mix(in_srgb,var(--color-primary)_88%,white)] to-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 sm:mt-0">
            {next.cta}
          </Link>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[color:var(--color-primary)] transition-all" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <li key={s.id} className="flex gap-2.5">
            <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] ${s.done ? "bg-green-500 text-white" : "border border-slate-300"}`}>{s.done ? "✓" : ""}</span>
            <div className="min-w-0">
              <p className={`text-sm font-medium ${s.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{s.label}</p>
              {!s.done && "hint" in s && s.hint && <p className="text-xs text-slate-500">{s.hint}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
