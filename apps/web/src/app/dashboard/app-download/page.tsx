"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";

interface SiteApk {
  id: string;
  name: string;
  subdomain: string | null;
  domain: string | null;
  settings: {
    apkUrl?: string;
    apkVersion?: string;
    apkName?: string;
    apkSize?: number;
  } | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function AppDownloadPage() {
  const [sites, setSites] = useState<SiteApk[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [version, setVersion] = useState("");
  const [appName, setAppName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/sites");
      const list = (res.data || res || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        subdomain: s.subdomain,
        domain: s.domain,
        settings: s.settings || null,
      }));
      setSites(list);
    } catch {
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const handleUpload = async (siteId: string) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(siteId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (version) formData.append("apkVersion", version);
      if (appName) formData.append("apkName", appName);
      await api.post(`/sites/${siteId}/apk`, formData);
      setVersion("");
      setAppName("");
      if (fileRef.current) fileRef.current.value = "";
      setSelectedSite(null);
      await fetchSites();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error al subir APK");
    } finally {
      setUploading(null);
    }
  };

  const handleRemove = async (siteId: string) => {
    if (!confirm("Eliminar el APK de este sitio?")) return;
    try {
      await api.delete(`/sites/${siteId}/apk`);
      await fetchSites();
    } catch {
      alert("Error al eliminar APK");
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">App Movil</h1>
      <p className="text-sm text-slate-500 mb-8">
        Sube el APK de tu aplicacion movil para que los visitantes de tu sitio puedan descargarla.
      </p>

      {loading ? (
        <p className="text-slate-500">Cargando sitios...</p>
      ) : sites.length === 0 ? (
        <p className="text-slate-500">No hay sitios creados.</p>
      ) : (
        <div className="space-y-4">
          {sites.map((site) => {
            const apk = site.settings;
            const hasApk = !!apk?.apkUrl;
            const isExpanded = selectedSite === site.id;

            return (
              <div key={site.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{site.name}</p>
                      <p className="text-xs text-slate-500">{site.domain || `${site.subdomain}.nextboostperu.com`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasApk ? (
                      <>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          APK activo
                        </span>
                        <button
                          onClick={() => setSelectedSite(isExpanded ? null : site.id)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Actualizar
                        </button>
                        <button
                          onClick={() => handleRemove(site.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setSelectedSite(isExpanded ? null : site.id)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        Subir APK
                      </button>
                    )}
                  </div>
                </div>

                {hasApk && (
                  <div className="px-4 pb-3 flex items-center gap-4 text-xs text-slate-500">
                    {apk?.apkVersion && <span>v{apk.apkVersion}</span>}
                    {apk?.apkSize && <span>{formatBytes(apk.apkSize)}</span>}
                    {apk?.apkName && <span>{apk.apkName}</span>}
                    <a href={apk?.apkUrl} target="_blank" rel="noopener" className="text-primary-600 hover:underline ml-auto">
                      Abrir enlace
                    </a>
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50">
                    <div className="grid gap-3 sm:grid-cols-2 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de la app</label>
                        <input
                          className="input-field text-sm"
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                          placeholder="Mi App"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Version</label>
                        <input
                          className="input-field text-sm"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          placeholder="1.0.0"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Archivo APK</label>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".apk,application/vnd.android.package-archive"
                        className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                      />
                    </div>
                    <button
                      onClick={() => handleUpload(site.id)}
                      disabled={uploading === site.id}
                      className="btn-primary text-sm"
                    >
                      {uploading === site.id ? "Subiendo..." : "Guardar APK"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
