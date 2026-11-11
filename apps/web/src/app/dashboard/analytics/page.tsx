"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface DayView { date: string; views: number; }
interface AnalyticsData { summary: { totalViews: number; totalConversions: number; totalClicks: number }; dailyViews: DayView[]; topPages: Array<{ path: string; views: number }>; referrers: Array<{ referrer: string; count: number }>; }
interface Site { id: string; name: string; subdomain: string; }

const periods = [
  { label: "7 días", value: "7d" },
  { label: "30 días", value: "30d" },
  { label: "90 días", value: "90d" },
];

export default function AnalyticsPage() {
  const { tenant } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");

  useEffect(() => {
    api.get("/sites").then((res: any) => {
      const list = (res.data?.items || res.items || []) as Site[];
      setSites(list);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async (p?: string, siteId?: string) => {
    const periodParam = p || period;
    const sid = siteId !== undefined ? siteId : selectedSiteId;
    try {
      const params = new URLSearchParams({ period: periodParam });
      if (sid) params.set("siteId", sid);
      const res: any = await api.get(`/analytics/overview?${params.toString()}`);
      setData(res.data || res);
    } catch {} finally { setLoading(false); }
  }, [period, selectedSiteId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changePeriod = (p: string) => { setPeriod(p); setLoading(true); fetchData(p); };
  const changeSite = (siteId: string) => { setSelectedSiteId(siteId); setLoading(true); fetchData(period, siteId); };

  if (loading) return (
    <div className="p-8 max-w-7xl mx-auto animate-pulse">
      <div className="space-y-2 mb-8">
        <div className="h-8 w-48 rounded-lg bg-[#e3e3e3]" />
        <div className="h-4 w-72 rounded-lg bg-[#e3e3e3]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] h-24" />)}
      </div>
      <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] h-72 mb-8" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] h-48" />
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] h-48" />
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-center"><p className="text-[#616161]">Sin datos de analytics</p><p className="text-sm text-[#8a8a8a] mt-1">Los datos aparecerán cuando tus sitios reciban visitas</p></div>;

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div><h1 className="text-xl font-bold text-[#303030]">Analytics</h1><p className="text-sm text-[#616161] mt-1">{tenant?.name}</p></div>
        <div className="flex items-center gap-3">
          {sites.length > 1 && (
            <select value={selectedSiteId} onChange={e => changeSite(e.target.value)} className="rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] bg-white px-3 py-1.5 text-xs font-medium text-[#303030] focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Todos los sitios</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <div className="flex gap-1 bg-[#f1f1f1] rounded-lg p-1">
            {periods.map(p => <button key={p.value} onClick={() => changePeriod(p.value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${period===p.value?"bg-white shadow-sm text-[#303030]":"text-[#616161] hover:text-[#303030]"}`}>{p.label}</button>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] p-5"><p className="text-xs font-medium text-[#616161] uppercase">Visitas</p><p className="text-3xl font-bold text-primary-700 mt-1">{data.summary.totalViews}</p><p className="text-xs text-[#8a8a8a] mt-1">{period}</p></div>
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] p-5"><p className="text-xs font-medium text-[#616161] uppercase">Conversiones</p><p className="text-3xl font-bold text-green-700 mt-1">{data.summary.totalConversions}</p><p className="text-xs text-[#8a8a8a] mt-1">{data.summary.totalViews>0?Math.round(data.summary.totalConversions/data.summary.totalViews*100):0}% tasa</p></div>
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] p-5"><p className="text-xs font-medium text-[#616161] uppercase">Clics</p><p className="text-3xl font-bold text-purple-700 mt-1">{data.summary.totalClicks}</p><p className="text-xs text-[#8a8a8a] mt-1">WhatsApp + CTAs</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] p-6 mb-8">
        <h3 className="font-semibold text-[#303030] mb-6">Visitas diarias</h3>
        {data.dailyViews && data.dailyViews.length > 0 ? (
          <div className="flex items-end gap-1 h-48">
            {data.dailyViews.map((day) => {
              const max = Math.max(...data.dailyViews.map(d=>d.views), 1);
              const pct = (day.views/max)*100;
              return (<div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                <span className="text-[10px] font-medium text-[#616161]">{day.views||""}</span>
                <div className="w-full bg-primary-500 rounded-t transition-all hover:bg-primary-600" style={{height:`${Math.max(pct,3)}%`}} title={`${day.date}: ${day.views} visitas`}/>
                <span className="text-[10px] text-[#8a8a8a] truncate w-full text-center">{day.date.slice(5)}</span>
              </div>);
            })}
          </div>
        ) : <p className="text-sm text-[#8a8a8a] text-center py-8">Sin datos de visitas</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] p-6"><h3 className="font-semibold text-[#303030] mb-4">Páginas más visitadas</h3>
          {data.topPages?.length>0?<div className="space-y-2">{data.topPages.map((p,i)=>(<div key={i} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><span className="text-xs font-medium text-[#8a8a8a] w-5">{i+1}</span><span className="text-[#303030] truncate">{p.path||"/"}</span></div><span className="text-[#616161] font-medium text-xs">{p.views}</span></div>))}</div>:<p className="text-sm text-[#8a8a8a]">Sin datos</p>}
        </div>
        <div className="bg-white rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] p-6"><h3 className="font-semibold text-[#303030] mb-4">Referencias</h3>
          {data.referrers?.length>0?<div className="space-y-2">{data.referrers.map((r,i)=>(<div key={i} className="flex items-center justify-between text-sm"><span className="text-[#303030] truncate">{r.referrer||"Directo"}</span><span className="text-[#616161] font-medium text-xs">{r.count}</span></div>))}</div>:<p className="text-sm text-[#8a8a8a]">Sin datos</p>}
        </div>
      </div>
    </div>);
}
