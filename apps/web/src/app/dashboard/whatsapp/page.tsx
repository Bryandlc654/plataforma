"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export default function WhatsAppPage() {
  const { tenant } = useAuthStore();
  const [settings, setSettings] = useState<any>({
    enabled: false, phoneNumber: "", message: "Hola, quisiera más información.",
    buttonColor: "#25D366", buttonPosition: "right",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const fetchSettings = async () => {
    try {
      const res: any = await api.get("/whatsapp/settings");
      setSettings((res.data || res) as any);
    } catch {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/whatsapp/settings", settings);
      setToast({ type: "success", message: "Configuración guardada" });
    } catch { setToast({ type: "error", message: "Error al guardar" }); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-slate-500">Cargando...</p></div>;
  }

  return (
      <main className="flex-1 p-8 bg-slate-50">
        {toast && <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>{toast.message}</div>}
        <div className="max-w-lg">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Integración WhatsApp</h1>
          <p className="text-sm text-slate-600 mb-8">
            Configura el botón flotante de WhatsApp que aparecerá en tus sitios web
          </p>

          <div className="card space-y-5">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Activar botón</p>
                <p className="text-xs text-slate-500">Mostrar botón flotante de WhatsApp en tus sitios</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enabled ? "bg-primary-600" : "bg-slate-200"
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enabled ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            <hr className="border-slate-200" />

            {/* Phone */}
            <div>
              <label className="label">Número de WhatsApp</label>
              <input
                type="text"
                className="input-field"
                placeholder="+593 99 999 9999"
                value={settings.phoneNumber || ""}
                onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
              />
            </div>

            {/* Message */}
            <div>
              <label className="label">Mensaje predeterminado</label>
              <textarea
                className="input-field"
                rows={3}
                value={settings.message || ""}
                onChange={(e) => setSettings({ ...settings, message: e.target.value })}
              />
            </div>

            {/* Color */}
            <div>
              <label className="label">Color del botón</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.buttonColor || "#25D366"}
                  onChange={(e) => setSettings({ ...settings, buttonColor: e.target.value })}
                  className="h-10 w-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  className="input-field"
                  value={settings.buttonColor || ""}
                  onChange={(e) => setSettings({ ...settings, buttonColor: e.target.value })}
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="label">Posición</label>
              <select
                className="input-field"
                value={settings.buttonPosition || "right"}
                onChange={(e) => setSettings({ ...settings, buttonPosition: e.target.value })}
              >
                <option value="right">Derecha</option>
                <option value="left">Izquierda</option>
              </select>
            </div>

            {/* Preview */}
            {settings.enabled && (
              <div className="relative border border-slate-200 rounded-lg p-4 bg-white">
                <p className="text-xs font-medium text-slate-500 mb-3">Vista previa</p>
                <div className="bg-slate-100 rounded-lg h-32 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Sitio web</span>
                  </div>
                  <div
                    className="absolute bottom-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
                    style={{
                      backgroundColor: settings.buttonColor,
                      [settings.buttonPosition || "right"]: "16px",
                    }}
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                </div>
              </div>
            )}

            <hr className="border-slate-200" />

            <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </div>
      </main>
    );
}
