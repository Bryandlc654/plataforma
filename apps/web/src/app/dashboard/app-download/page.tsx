"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface ApkInfo {
  apkUrl?: string;
  apkVersion?: string;
  apkName?: string;
  apkSize?: number;
  updatedAt?: string;
  message?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function AppDownloadPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.roles?.includes("super_admin");
  const [apkInfo, setApkInfo] = useState<ApkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [version, setVersion] = useState("");
  const [appName, setAppName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchApk = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/app-download");
      const data = res.data || res;
      setApkInfo(data.apkUrl ? data : null);
    } catch {
      setApkInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApk(); }, [fetchApk]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (version) formData.append("apkVersion", version);
      if (appName) formData.append("apkName", appName);
      await api.post("/app-download", formData);
      setVersion("");
      setAppName("");
      if (fileRef.current) fileRef.current.value = "";
      setToast("App actualizada correctamente");
      await fetchApk();
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Error al subir APK");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Eliminar la app? Los usuarios no podran descargarla.")) return;
    try {
      await api.delete("/app-download");
      setApkInfo(null);
      setToast("App eliminada");
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Error al eliminar");
    }
  };

  if (loading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <p className="text-slate-500">Cargando...</p>
      </div>
    );
  }

  const hasApk = !!apkInfo?.apkUrl;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-xl px-5 py-2.5 text-sm font-medium shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900 mb-2">App Movil</h1>
      <p className="text-sm text-slate-500 mb-8">
        {isSuperAdmin
          ? "Sube y gestiona la APK de la plataforma para que todos los negocios puedan descargarla."
          : "Descarga la app movil de Build Iceberg para gestionar tu negocio desde el celular."}
      </p>

      {/* Download card - shown to all users when APK exists */}
      {hasApk && (
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold">{apkInfo?.apkName || "Build Iceberg"}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/70">
                {apkInfo?.apkVersion && <span>v{apkInfo.apkVersion}</span>}
                {apkInfo?.apkSize && <span>{formatBytes(apkInfo.apkSize)}</span>}
                {apkInfo?.updatedAt && <span>Actualizado {new Date(apkInfo.updatedAt).toLocaleDateString("es-EC")}</span>}
              </div>
            </div>
            <a
              href={apkInfo!.apkUrl}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-white text-primary-700 px-6 py-3 text-sm font-bold hover:bg-white/90 transition-colors shadow-lg flex-shrink-0"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar APK
            </a>
          </div>
        </div>
      )}

      {!hasApk && !isSuperAdmin && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">La app no esta disponible aun. Pronto podras descargarla.</p>
        </div>
      )}

      {/* Super admin: upload / manage */}
      {isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-900">
              {hasApk ? "Actualizar app" : "Subir primera version"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Solo los super admin pueden gestionar la app de la plataforma.
            </p>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de la app</label>
                <input
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  placeholder="Build Iceberg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Version</label>
                <input
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Archivo APK</label>
              <input
                ref={fileRef}
                type="file"
                accept=".apk,application/vnd.android.package-archive"
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {hasApk ? "Actualizar" : "Subir APK"}
                  </>
                )}
              </button>

              {hasApk && (
                <button
                  onClick={handleRemove}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fade-in{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}.animate-fade-in{animation:fade-in .2s ease-out}
      `}</style>
    </div>
  );
}
