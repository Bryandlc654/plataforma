"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface TenantSettings { name: string; slug: string; subdomain: string; customDomain: string; logoUrl: string; faviconUrl: string; primaryColor: string; secondaryColor: string; settings: { locale?: string; currency?: string; timezone?: string; branding?: any; social?: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; youtube?: string; tiktok?: string }; businessHours?: { days?: string; hours?: string } }; }

export default function SettingsPage() {
  const { tenantId } = useAuthStore();
  const [data, setData] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try { const res: any = await api.get(`/tenants/${tenantId}/settings`); setData(res.data||res); }
    catch {} finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateField = (section: string, key: string, value: any) => {
    if (!data) return;
    if (section === "social") setData({ ...data, settings: { ...data.settings, social: { ...(data.settings?.social||{}), [key]: value } } });
    else if (section === "hours") setData({ ...data, settings: { ...data.settings, businessHours: { ...(data.settings?.businessHours||{}), [key]: value } } });
    else setData({ ...data, [key]: value } as any);
  };

  const saveGeneral = async () => { setSaving(true); try { await api.put(`/tenants/${tenantId}`, { name: data?.name, primaryColor: data?.primaryColor, secondaryColor: data?.secondaryColor, logoUrl: data?.logoUrl, faviconUrl: data?.faviconUrl }); alert("Guardado"); } catch { alert("Error"); } finally { setSaving(false); } };
  const saveAdvanced = async () => { setSaving(true); try { await api.put(`/tenants/${tenantId}/settings`, data?.settings); alert("Guardado"); } catch { alert("Error"); } finally { setSaving(false); } };

  if (loading) return <div className="p-8 flex items-center justify-center"><p className="text-slate-500">Cargando configuración...</p></div>;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Configuración</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Branding</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label><input className="input-field" value={data?.name||""} onChange={e=>updateField("root","name",e.target.value)}/></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Dominio</label><input className="input-field" value={data?.customDomain||""} onChange={e=>updateField("root","customDomain",e.target.value)} placeholder="midominio.com"/></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Color primario</label><div className="flex gap-2"><input type="color" className="h-10 w-10 rounded" value={data?.primaryColor||"#2563EB"} onChange={e=>updateField("root","primaryColor",e.target.value)}/><input className="input-field" value={data?.primaryColor||""} onChange={e=>updateField("root","primaryColor",e.target.value)}/></div></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Color secundario</label><div className="flex gap-2"><input type="color" className="h-10 w-10 rounded" value={data?.secondaryColor||"#1E40AF"} onChange={e=>updateField("root","secondaryColor",e.target.value)}/><input className="input-field" value={data?.secondaryColor||""} onChange={e=>updateField("root","secondaryColor",e.target.value)}/></div></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Logo URL</label><input className="input-field" value={data?.logoUrl||""} onChange={e=>updateField("root","logoUrl",e.target.value)}/></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Favicon URL</label><input className="input-field" value={data?.faviconUrl||""} onChange={e=>updateField("root","faviconUrl",e.target.value)}/></div>
        </div>
        <button onClick={saveGeneral} disabled={saving} className="btn-primary mt-4 text-sm">{saving?"Guardando...":"Guardar branding"}</button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Regional</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Idioma</label><select className="input-field" value={data?.settings?.locale||"es"} onChange={e=>updateField("root","settings",{...data?.settings,locale:e.target.value})}><option value="es">Español</option><option value="en">English</option><option value="pt">Português</option></select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Moneda</label><select className="input-field" value={data?.settings?.currency||"USD"} onChange={e=>updateField("root","settings",{...data?.settings,currency:e.target.value})}><option value="USD">USD</option><option value="EUR">EUR</option><option value="MXN">MXN</option><option value="COP">COP</option></select></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Zona horaria</label><select className="input-field" value={data?.settings?.timezone||"America/Guayaquil"} onChange={e=>updateField("root","settings",{...data?.settings,timezone:e.target.value})}><option value="America/Guayaquil">Ecuador (GMT-5)</option><option value="America/Mexico_City">México (GMT-6)</option><option value="America/Bogota">Colombia (GMT-5)</option><option value="America/Lima">Perú (GMT-5)</option></select></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Redes Sociales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[{key:"facebook",label:"Facebook",placeholder:"facebook.com/minegocio"},{key:"instagram",label:"Instagram",placeholder:"instagram.com/minegocio"},{key:"twitter",label:"X / Twitter",placeholder:"x.com/minegocio"},{key:"linkedin",label:"LinkedIn",placeholder:"linkedin.com/company/minegocio"},{key:"youtube",label:"YouTube",placeholder:"youtube.com/@minegocio"},{key:"tiktok",label:"TikTok",placeholder:"tiktok.com/@minegocio"}].map(s=>(<div key={s.key}><label className="block text-xs font-medium text-slate-600 mb-1">{s.label}</label><input className="input-field" value={data?.settings?.social?.[s.key as keyof typeof data.settings.social]||""} onChange={e=>updateField("social",s.key,e.target.value)} placeholder={s.placeholder}/></div>))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="font-semibold text-slate-900 mb-4">Horario de Atención</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Días</label><input className="input-field" value={data?.settings?.businessHours?.days||""} onChange={e=>updateField("hours","days",e.target.value)} placeholder="Lunes a Viernes"/></div>
          <div><label className="block text-xs font-medium text-slate-600 mb-1">Horario</label><input className="input-field" value={data?.settings?.businessHours?.hours||""} onChange={e=>updateField("hours","hours",e.target.value)} placeholder="9:00 AM - 6:00 PM"/></div>
        </div>
      </div>

      <button onClick={saveAdvanced} disabled={saving} className="btn-primary w-full text-sm">{saving?"Guardando...":"Guardar configuración"}</button>
    </div>);
}
