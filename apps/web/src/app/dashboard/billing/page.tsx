"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";

interface CurrentSub { id: string; plan: any; status: string; currentPeriodStart: string; currentPeriodEnd: string; paymentMethod: string; limits: { maxUsers: number; maxSites: number; maxStorage: string; storageUsed: string }; }
interface Plan { id: string; name: string; slug: string; price: number; maxUsers: number; maxSites: number; maxStorage: string; features: any; }
interface Invoice { id: string; amount: string; currency: string; status: string; paidAt: string; createdAt: string; }

export default function BillingPage() {
  const { tenant, user } = useAuthStore();
  const [sub, setSub] = useState<CurrentSub | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();
  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { const [a,b,c]: any[] = await Promise.all([api.get("/subscriptions/current"), api.get("/plans"), api.get("/billing/invoices")]); setSub(a.data||a); setPlans(b.data||b); setInvoices(c.data||c); } catch {} finally { setLoading(false); }
  };
  const handleUpgrade = async (planId: string) => { if(!(await confirm("¿Cambiar de plan?")))return; try{await api.post("/subscriptions/upgrade",{planId});fetchData()}catch(e:any){alert(e.response?.data?.message||"Error")} };
  const handleDowngrade = async (planId: string) => { if(!(await confirm("¿Bajar de plan?")))return; try{await api.post("/subscriptions/downgrade",{planId});fetchData()}catch(e:any){alert(e.response?.data?.message||"Error")} };
  const handleCancel = async () => { if(!(await confirm("¿Cancelar suscripción?")))return; try{await api.post("/subscriptions/cancel");fetchData()}catch(e:any){alert(e.response?.data?.message||"Error")} };
  const handlePaymentLink = async (slug: string) => { try{const r:any=await api.post("/billing/payment-link",{planSlug:slug});const d=r.data||r;if(d.paymentUrl)window.open(d.paymentUrl,"_blank")}catch(e:any){alert(e.response?.data?.message||"Error")} };
  if(loading) return <div className="p-8 flex items-center justify-center"><p className="text-slate-500">Cargando...</p></div>;
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Facturación</h1>
      <div className="card mb-8"><h2 className="font-semibold text-slate-900 mb-4">Plan actual</h2>
        <div className="flex items-start justify-between"><div><div className="flex items-center gap-3 mb-2"><span className="text-xl font-bold text-slate-900">{sub?.plan?.name||"Free"}</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sub?.status==="active"?"bg-green-50 text-green-700":"bg-slate-50 text-slate-700"}`}>{sub?.status==="active"?"Activo":sub?.status||"Free"}</span></div>{sub?.currentPeriodEnd&&<p className="text-sm text-slate-500">Próximo pago: {formatDate(sub.currentPeriodEnd)}</p>}</div>
          <div className="text-right"><p className="text-3xl font-bold text-primary-600">{sub?.plan?.price?formatCurrency(Number(sub.plan.price)):"Gratis"}</p><p className="text-xs text-slate-400">/mes</p></div></div>
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-slate-100"><div><p className="text-xs text-slate-500">Usuarios</p><p className="text-sm font-medium text-slate-700">{sub?.limits?.maxUsers||0} máx.</p></div><div><p className="text-xs text-slate-500">Sitios</p><p className="text-sm font-medium text-slate-700">{sub?.limits?.maxSites||0} máx.</p></div><div><p className="text-xs text-slate-500">Almacenamiento</p><p className="text-sm font-medium text-slate-700">{Math.round(Number(sub?.limits?.maxStorage||0)/1024/1024)} MB</p></div></div>
        {sub?.plan?.price>0&&<button onClick={handleCancel} className="mt-4 text-xs text-red-600 hover:text-red-700">Cancelar suscripción</button>}
      </div>
      <h2 className="font-semibold text-slate-900 mb-4">Cambiar de plan</h2>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {plans.map((p)=>{const isC=sub?.plan?.slug===p.slug;const isU=Number(p.price)>Number(sub?.plan?.price||0);return(<div key={p.id} className={`card border-2 ${isC?"border-primary-500 bg-primary-50/50":"border-slate-200"}`}><h3 className="font-semibold text-slate-900">{p.name}</h3><p className="text-2xl font-bold text-primary-600 mt-2">{Number(p.price)===0?"Gratis":formatCurrency(Number(p.price))}<span className="text-sm font-normal text-slate-400">/mes</span></p><ul className="mt-4 space-y-1 text-sm text-slate-600"><li>✓ {p.maxUsers} usuarios</li><li>✓ {p.maxSites} sitios</li><li>✓ {Math.round(Number(p.maxStorage)/1024/1024)} MB</li></ul>{isC?<button className="mt-4 w-full btn-secondary text-sm cursor-default" disabled>Plan actual</button>:isU?<button onClick={()=>Number(p.price)===0?handleDowngrade(p.id):handlePaymentLink(p.slug)} className="mt-4 w-full btn-primary text-sm">Subir a {p.name}</button>:<button onClick={()=>handleDowngrade(p.id)} className="mt-4 w-full btn-ghost text-sm">Bajar a {p.name}</button>}</div>)})}
      </div>
      <h2 className="font-semibold text-slate-900 mb-4">Historial de pagos</h2>
      {invoices.length===0?<div className="card text-center py-8"><p className="text-sm text-slate-500">Sin facturas</p></div>:
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200"><th className="text-left py-2 px-4 text-slate-600 font-medium">Fecha</th><th className="text-left py-2 px-4 text-slate-600 font-medium">Monto</th><th className="text-left py-2 px-4 text-slate-600 font-medium">Estado</th></tr></thead><tbody>{invoices.map((inv)=>(<tr key={inv.id} className="border-b border-slate-100"><td className="py-2 px-4">{formatDate(inv.createdAt)}</td><td className="py-2 px-4 font-medium">{formatCurrency(Number(inv.amount))}</td><td className="py-2 px-4"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status==="paid"?"bg-green-50 text-green-700":"bg-yellow-50 text-yellow-700"}`}>{inv.status==="paid"?"Pagado":inv.status}</span></td></tr>))}</tbody></table></div>}
    </div>);
}
