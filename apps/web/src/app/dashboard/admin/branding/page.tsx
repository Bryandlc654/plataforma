"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { usePlatformBranding } from "@/components/providers/platform-branding-provider";
import { contrastColor, resolveBrandingLogo } from "@/lib/platform-branding";

export default function PlatformBrandingPage() {
  const { user } = useAuthStore();
  const { branding, applyBranding } = usePlatformBranding();
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.roles?.includes("super_admin") || user?.roles?.includes("platform_admin");
  const logo = resolveBrandingLogo(logoUrl);
  const onSecondary = contrastColor(secondaryColor);

  useEffect(() => {
    setPrimaryColor(branding.primaryColor);
    setSecondaryColor(branding.secondaryColor);
    setLogoUrl(branding.logoUrl);
  }, [branding]);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res: any = await api.post("/platform/branding/logo", form);
      const next = res.data || res;
      applyBranding(next);
      setMessage("Logo actualizado correctamente.");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo subir el logo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveColors = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res: any = await api.put("/platform/branding", { primaryColor, secondaryColor });
      const next = res.data || res;
      applyBranding(next);
      setMessage("Colores actualizados en toda la plataforma.");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudieron guardar los colores.");
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res: any = await api.put("/platform/branding", { logoUrl: null });
      const next = res.data || res;
      applyBranding(next);
      setMessage("Logo eliminado.");
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo eliminar el logo.");
    } finally {
      setSaving(false);
    }
  };

  if (!canEdit) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-semibold text-amber-900">Sin permisos</h1>
          <p className="mt-1 text-sm text-amber-800">
            Solo el superadmin o el admin de plataforma pueden cambiar la marca.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Marca de la plataforma</h1>
        <p className="mt-1 text-sm text-slate-500">
          El logo y los colores se aplican en el login, el sidebar y todo el panel.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Logo</h2>
            <p className="mt-1 text-sm text-slate-500">
              Sube una imagen con fondo transparente para que se vea bien sobre el sidebar morado.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-48 items-center justify-center overflow-hidden">
                {logo ? (
                  <img
                    src={logo}
                    alt="Logo de la plataforma"
                    className="h-full w-auto max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">Sin logo</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl bg-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-on-secondary)] transition hover:bg-[var(--brand-secondary-hover)] disabled:opacity-50"
                >
                  {uploading ? "Subiendo..." : logo ? "Cambiar logo" : "Subir logo"}
                </button>
                {logo && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Quitar logo
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Colores de la plataforma</h2>
            <p className="mt-1 text-sm text-slate-500">
              El color primario se usa en el sidebar y las superficies oscuras. El secundario en botones y acentos.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <ColorField label="Color primario" value={primaryColor} onChange={setPrimaryColor} />
              <ColorField label="Color secundario" value={secondaryColor} onChange={setSecondaryColor} />
            </div>

            <button
              type="button"
              onClick={saveColors}
              disabled={saving}
              className="mt-6 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--brand-primary-hover)] disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar colores"}
            </button>
          </section>
        </div>

        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Vista previa</h2>
          <p className="mt-1 text-sm text-slate-500">Así se verá la marca en el menú y en los accesos.</p>

          <div className="mt-5 overflow-hidden rounded-xl" style={{ background: primaryColor }}>
            <div className="flex items-center gap-2 px-4 py-3 text-white">
              {logo ? (
                <img src={logo} alt="" className="h-6 w-auto max-w-[120px] object-contain" />
              ) : (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-black"
                  style={{ background: secondaryColor, color: onSecondary }}
                >
                  P
                </span>
              )}
              <span className="text-sm font-semibold">Plataforma</span>
            </div>
            <div className="space-y-1 p-3">
              <div className="rounded-lg bg-white/15 px-3 py-2 text-xs font-medium text-white">Inicio</div>
              <div className="px-3 py-2 text-xs text-white/70">Sitios web</div>
              <div className="px-3 py-2 text-xs text-white/70">Leads</div>
            </div>
            <div className="p-3">
              <div
                className="rounded-full px-4 py-2 text-center text-xs font-semibold"
                style={{ background: secondaryColor, color: onSecondary }}
              >
                Elegir un plan
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 text-center text-xs font-semibold text-white" style={{ background: primaryColor }}>
              Primario
            </div>
            <div className="rounded-xl p-3 text-center text-xs font-semibold" style={{ background: secondaryColor, color: onSecondary }}>
              Secundario
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safeColor}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#201b51"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm uppercase text-slate-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]"
        />
      </div>
    </div>
  );
}
