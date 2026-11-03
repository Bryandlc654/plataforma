"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface PaypalConfig {
  enabled: boolean;
  mode: "sandbox" | "live";
  clientId: string;
  hasSecret: boolean;
}

export default function PlatformPaymentsPage() {
  const { user } = useAuthStore();
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"sandbox" | "live">("sandbox");
  const [clientId, setClientId] = useState("");
  const [secret, setSecret] = useState("");
  const [hasSecret, setHasSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEdit = user?.roles?.includes("super_admin") || user?.roles?.includes("platform_admin");

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/platform/payments");
      const config: PaypalConfig = res.data?.paypal || res.paypal || {};
      setEnabled(config.enabled === true);
      setMode(config.mode === "live" ? "live" : "sandbox");
      setClientId(config.clientId || "");
      setHasSecret(config.hasSecret === true);
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo cargar la configuración de PayPal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canEdit) load();
    else setLoading(false);
  }, [canEdit]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put("/platform/payments", {
        paypal: { enabled, mode, clientId, secret },
      });
      setSecret("");
      setMessage("Configuración de PayPal guardada. Los pagos de planes se enviarán a esta cuenta.");
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || "No se pudo guardar la configuración.");
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
            Solo el superadmin o el admin de plataforma pueden configurar los pagos de la plataforma.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Cargando configuración de PayPal...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pagos de la plataforma</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configura la cuenta de PayPal que recibirá los pagos de los planes y suscripciones.
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

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">PayPal</h2>
              <p className="mt-1 text-sm text-slate-500">
                Usa las credenciales de una app REST de PayPal. El dinero entra directamente a esa cuenta.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[var(--color-primary)] focus:ring-[rgba(var(--color-primary-rgb),0.2)]"
              />
              Activo
            </label>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Modo</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value === "live" ? "live" : "sandbox")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]"
              >
                <option value="sandbox">Pruebas (sandbox)</option>
                <option value="live">Producción (live)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Client ID</label>
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="AeA1Q..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Secret</label>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder={hasSecret ? "•••••••• (ya guardado)" : "EGn1..."}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--color-primary-rgb),0.15)]"
              />
              <p className="mt-2 text-xs text-slate-500">
                Déjalo vacío para conservar el secret actual.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="mt-6 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--brand-primary-hover)] disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </section>

        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Cómo funciona</h2>
          <ol className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2"><span className="font-semibold text-[var(--color-primary)]">1.</span> Crea una app REST en el panel de desarrolladores de PayPal.</li>
            <li className="flex gap-2"><span className="font-semibold text-[var(--color-primary)]">2.</span> Copia el Client ID y el Secret de esa app.</li>
            <li className="flex gap-2"><span className="font-semibold text-[var(--color-primary)]">3.</span> Actívalos aquí y guarda. Los cobros de planes llegarán a esa cuenta.</li>
          </ol>

          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
            Usa el modo <strong>sandbox</strong> para probar con cuentas de prueba y cámbialo a <strong>live</strong> cuando estés listo para cobrar de verdad.
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">Estado</p>
              <p className="text-xs text-slate-500">{enabled ? "PayPal activo para planes" : "PayPal inactivo"}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {enabled ? "Activo" : "Inactivo"}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
