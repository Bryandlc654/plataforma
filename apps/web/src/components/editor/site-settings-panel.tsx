"use client";

import Link from "next/link";
import { HiOutlineX } from "react-icons/hi";
import { ImageField } from "@/components/blocks/editors/image-field";
import { PALETTE_LABELS, PALETTE_PRESETS, type PaletteRole, type SitePalette } from "@/lib/templates";

export type SettingsTab = "theme" | "config";

export interface SiteSettingsForm { name: string; primaryColor: string; secondaryColor: string; logoUrl: string; faviconUrl: string; domain: string; }

interface Props {
  tab: SettingsTab;
  onTabChange: (t: SettingsTab) => void;
  onClose: () => void;
  onSave: () => void;
  form: SiteSettingsForm;
  onFormChange: (f: SiteSettingsForm) => void;
  palette: SitePalette;
  onPreset: (p: SitePalette) => void;
  onColor: (role: PaletteRole, value: string) => void;
  unpublishedBehavior: "404" | "maintenance";
  onUnpublishedBehavior: (v: "404" | "maintenance") => void;
  dnsStatus: "idle" | "checking" | "ok" | "error";
  checkingDns: boolean;
  onCheckDns: () => void;
  onBuyDomain: () => void;
}

const ROLES: PaletteRole[] = ["primary", "secondary", "accent", "background", "surface", "text"];
const card = "space-y-3 rounded-xl border border-[#e3e3e3] bg-[#f7f7f7] p-3";
const label = "mb-1 block text-xs font-medium text-[#616161]";

export function SiteSettingsPanel(p: Props) {
  const set = (patch: Partial<SiteSettingsForm>) => p.onFormChange({ ...p.form, ...patch });

  return (
    <aside className="flex w-[360px] flex-shrink-0 flex-col border-l border-[#e3e3e3] bg-white">
      <div className="flex items-center justify-between border-b border-[#e3e3e3] px-4 py-3">
        <div className="flex gap-1">
          {([["theme", "Tema"], ["config", "Configuración"]] as const).map(([key, text]) => (
            <button
              key={key}
              onClick={() => p.onTabChange(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${p.tab === key ? "bg-[color:var(--color-primary)] text-white" : "text-[#616161] hover:bg-[#f1f1f1]"}`}
            >
              {text}
            </button>
          ))}
        </div>
        <button onClick={p.onClose} className="rounded-lg p-1 text-[#8a8a8a] hover:text-[#616161]" title="Guardar y cerrar"><HiOutlineX className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {p.tab === "theme" ? (
          <>
            <div>
              <p className="text-sm font-semibold text-[#303030]">Colores del sitio</p>
              <p className="mt-0.5 text-xs text-[#616161]">Se aplican a todas las páginas. Verás el cambio al instante.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => p.onPreset({ ...preset.palette })}
                  className="inline-flex items-center gap-1.5 rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] bg-white px-2 py-1 text-[11px] font-medium text-[#616161] hover:border-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
                  title={`Aplicar paleta ${preset.name}`}
                >
                  <span className="flex -space-x-1">
                    {[preset.palette.primary, preset.palette.secondary, preset.palette.accent].map((c, i) => (
                      <span key={i} className="h-3 w-3 rounded-full border border-white" style={{ background: c }} />
                    ))}
                  </span>
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => (
                <div key={role}>
                  <label className={label}>{PALETTE_LABELS[role]}</label>
                  <div className="flex gap-2">
                    <input type="color" className="h-8 w-8 cursor-pointer rounded border-0 p-0" value={p.palette[role]} onChange={(e) => p.onColor(role, e.target.value)} />
                    <input className="input-field flex-1 text-xs" value={p.palette[role]} onChange={(e) => p.onColor(role, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>

            <div className={card}>
              <p className="text-xs font-semibold text-[#303030]">Identidad</p>
              <ImageField label="Logo" value={p.form.logoUrl} onChange={(v) => set({ logoUrl: v })} />
              <ImageField label="Favicon" value={p.form.faviconUrl} onChange={(v) => set({ faviconUrl: v })} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={label}>Nombre del sitio</label>
              <input className="input-field text-xs" value={p.form.name} onChange={(e) => set({ name: e.target.value })} />
            </div>

            <div className={card}>
              <label className="block text-xs font-semibold text-[#303030]">Dominio personalizado</label>
              <div className="flex gap-2">
                <input className="input-field flex-1 text-xs" value={p.form.domain} onChange={(e) => set({ domain: e.target.value })} placeholder="www.midominio.com" />
                <button onClick={p.onCheckDns} disabled={p.checkingDns || !p.form.domain} className="whitespace-nowrap rounded-lg bg-[color:var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50">
                  {p.checkingDns ? "Verificando…" : "Verificar"}
                </button>
              </div>
              <button type="button" onClick={p.onBuyDomain} className="w-full rounded-lg border border-dashed border-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--color-primary)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_6%,transparent)]">¿No tienes dominio? Busca y compra uno</button>
              {p.dnsStatus === "ok" && <div className="rounded-lg border border-green-200 bg-green-50 p-2.5"><p className="text-xs font-medium text-green-700">Dominio conectado</p><p className="mt-0.5 text-xs text-green-600">Tu sitio está en <strong>https://{p.form.domain}</strong></p></div>}
              {p.dnsStatus === "error" && <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5"><p className="text-xs font-medium text-amber-700">DNS no configurado</p><p className="mt-0.5 text-xs text-amber-600">Apunta tu dominio al servidor y verifica de nuevo.</p></div>}
            </div>

            <div className={card}>
              <div>
                <p className="text-xs font-semibold text-[#303030]">Si despublicas el sitio</p>
                <p className="mt-0.5 text-[11px] text-[#616161]">Qué verá el visitante mientras la web no esté publicada.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([["404", "Página 404"], ["maintenance", "En mantenimiento"]] as const).map(([value, text]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => p.onUnpublishedBehavior(value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${p.unpublishedBehavior === value ? "border-[color:var(--color-primary)] bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[color:var(--color-primary)]" : "border-[#e3e3e3] bg-white text-[#616161] hover:border-[#d4d4d4]"}`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#e3e3e3] bg-[#f7f7f7] p-3">
              <p className="mb-0.5 text-xs font-medium text-[#303030]">SEO del sitio</p>
              <p className="mb-2 text-xs text-[#616161]">Títulos, descripciones y OpenGraph se gestionan desde el módulo SEO.</p>
              <Link href="/dashboard/seo" onClick={p.onSave} className="text-xs font-semibold text-[color:var(--color-primary)] hover:underline">Ir al módulo SEO →</Link>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-[#e3e3e3] p-3">
        <button onClick={p.onSave} className="w-full rounded-lg bg-gradient-to-b from-[color:color-mix(in_srgb,var(--color-primary)_88%,white)] to-[color:var(--color-primary)] py-2 text-xs font-semibold text-white hover:opacity-90">Guardar cambios</button>
      </div>
    </aside>
  );
}
