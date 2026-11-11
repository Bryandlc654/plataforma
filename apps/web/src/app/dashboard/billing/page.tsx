"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/components/providers/confirm-provider";
import { AdminModuleTabs } from "@/components/admin/admin-module-tabs";

interface CurrentSub { id: string; plan: any; status: string; currentPeriodStart: string; currentPeriodEnd: string; paymentMethod: string; limits: { maxUsers: number; maxSites: number; maxStorage: string; storageUsed: string }; }
interface Plan { id: string; name: string; slug: string; price: number; maxUsers: number; maxSites: number; maxStorage: string; features: any; }
interface Invoice { id: string; amount: string; currency: string; status: string; paidAt: string; createdAt: string; }

export default function BillingPage() {
  const { tenant, user } = useAuthStore();
  const [sub, setSub] = useState<CurrentSub | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [methods, setMethods] = useState<{ paypal: { enabled: boolean }; payphone: { enabled: boolean } } | null>(null);
  const [trialNotice, setTrialNotice] = useState(false);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setTrialNotice(new URLSearchParams(window.location.search).get("trial") === "expired");
    }
  }, []);
  const fetchData = async () => {
    try { const [a,b,c,d]: any[] = await Promise.all([api.get("/subscriptions/current"), api.get("/plans"), api.get("/billing/invoices"), api.get("/billing/payment-methods")]); setSub(a.data||a); setPlans(b.data||b); setInvoices(c.data||c); setMethods(d.data||d); } catch {} finally { setLoading(false); }
  };
  const handleUpgrade = async (planId: string) => { if(!(await confirm("¿Cambiar de plan?")))return; try{await api.post("/subscriptions/upgrade",{planId});fetchData()}catch(e:any){alert(e.response?.data?.message||"Error")} };
  const handleDowngrade = async (planId: string) => { if(!(await confirm("¿Bajar de plan?")))return; try{await api.post("/subscriptions/downgrade",{planId});fetchData()}catch(e:any){alert(e.response?.data?.message||"Error")} };
  const handleCancel = async () => { if(!(await confirm("¿Cancelar suscripción?")))return; try{await api.post("/subscriptions/cancel");fetchData()}catch(e:any){alert(e.response?.data?.message||"Error")} };
  const handlePaymentLink = async (slug: string) => { try{const r:any=await api.post("/billing/payment-link",{planSlug:slug});const d=r.data||r;if(d.paymentUrl)window.open(d.paymentUrl,"_blank")}catch(e:any){alert(e.response?.data?.message||"Error")} };
  const handlePaypal = async (slug: string) => { try{const r:any=await api.post("/billing/paypal/create-order",{planSlug:slug});const d=r.data||r;if(d.paymentUrl)window.location.href=d.paymentUrl;else alert("No se pudo abrir PayPal")}catch(e:any){alert(e.response?.data?.message||"Error")} };
  if(loading) return <div className="p-8 flex items-center justify-center"><p className="text-[#616161]">Cargando...</p></div>;
  return (
    <div className="p-8 max-w-4xl">
      <AdminModuleTabs />
      <h1 className="text-xl font-bold text-[#303030] mb-8">Facturación</h1>
      {trialNotice && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Tu prueba gratis terminó. Elige un plan de pago para reactivar el acceso al panel.
        </div>
      )}
      <div className="card mb-8"><h2 className="font-semibold text-[#303030] mb-4">Plan actual</h2>
        <div className="flex items-start justify-between"><div><div className="flex items-center gap-3 mb-2"><span className="text-xl font-bold text-[#303030]">{sub?.plan?.name||"Free"}</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sub?.status==="active"?"bg-green-50 text-green-700":"bg-[#f7f7f7] text-[#303030]"}`}>{sub?.status==="active"?"Activo":sub?.status||"Free"}</span></div>{sub?.currentPeriodEnd&&<p className="text-sm text-[#616161]">Próximo pago: {formatDate(sub.currentPeriodEnd)}</p>}</div>
          <div className="text-right"><p className="text-3xl font-bold text-primary-600">{sub?.plan?.price?formatCurrency(Number(sub.plan.price)):"Gratis"}</p><p className="text-xs text-[#8a8a8a]">/mes</p></div></div>
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-[#ebebeb]"><div><p className="text-xs text-[#616161]">Usuarios</p><p className="text-sm font-medium text-[#303030]">{sub?.limits?.maxUsers||0} máx.</p></div><div><p className="text-xs text-[#616161]">Sitios</p><p className="text-sm font-medium text-[#303030]">{sub?.limits?.maxSites||0} máx.</p></div><div><p className="text-xs text-[#616161]">Almacenamiento</p><p className="text-sm font-medium text-[#303030]">{Math.round(Number(sub?.limits?.maxStorage||0)/1024/1024)} MB</p></div></div>
        {sub?.plan?.price>0&&<button onClick={handleCancel} className="mt-4 text-xs text-red-600 hover:text-red-700">Cancelar suscripción</button>}
      </div>
      <h2 className="font-semibold text-[#303030] mb-4">Cambiar de plan</h2>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {(trialNotice ? plans.filter((p) => Number(p.price) > 0) : plans).map((p)=>{const isC=sub?.plan?.slug===p.slug;const isU=Number(p.price)>Number(sub?.plan?.price||0);return(<div key={p.id} className={`card border-2 ${isC?"border-primary-500 bg-primary-50/50":"border-[#e3e3e3]"}`}><h3 className="font-semibold text-[#303030]">{p.name}</h3><p className="text-2xl font-bold text-primary-600 mt-2">{Number(p.price)===0?"Gratis":formatCurrency(Number(p.price))}<span className="text-sm font-normal text-[#8a8a8a]">/mes</span></p><ul className="mt-4 space-y-1 text-sm text-[#616161]"><li>✓ {p.maxUsers} usuarios</li><li>✓ {p.maxSites} sitios</li><li>✓ {Math.round(Number(p.maxStorage)/1024/1024)} MB</li></ul>{isC?<button className="mt-4 w-full btn-secondary text-sm cursor-default" disabled>Plan actual</button>:isU?(Number(p.price)===0?<button onClick={()=>handleDowngrade(p.id)} className="mt-4 w-full btn-primary text-sm">Cambiar a {p.name}</button>:<div className="mt-4 space-y-2">{methods?.paypal?.enabled&&<button onClick={()=>handlePaypal(p.slug)} className="w-full btn-primary text-sm">Pagar con PayPal</button>}{methods?.payphone?.enabled&&<button onClick={()=>handlePaymentLink(p.slug)} className="w-full btn-secondary text-sm">Pagar con tarjeta</button>}{!methods?.paypal?.enabled&&!methods?.payphone?.enabled&&<button onClick={()=>alert("No hay una pasarela de pago configurada.")} className="w-full btn-secondary text-sm">Pago no disponible</button>}</div>):<button onClick={()=>handleDowngrade(p.id)} className="mt-4 w-full btn-ghost text-sm">Bajar a {p.name}</button>}</div>)})}
      </div>
      <h2 className="font-semibold text-[#303030] mb-4">Historial de pagos</h2>
      {invoices.length===0?<div className="card text-center py-8"><p className="text-sm text-[#616161]">Sin facturas</p></div>:
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-[#e3e3e3]"><th className="text-left py-2 px-4 text-[#616161] font-medium">Fecha</th><th className="text-left py-2 px-4 text-[#616161] font-medium">Monto</th><th className="text-left py-2 px-4 text-[#616161] font-medium">Estado</th></tr></thead><tbody>{invoices.map((inv)=>(<tr key={inv.id} className="border-b border-[#ebebeb]"><td className="py-2 px-4">{formatDate(inv.createdAt)}</td><td className="py-2 px-4 font-medium">{formatCurrency(Number(inv.amount))}</td><td className="py-2 px-4"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${inv.status==="paid"?"bg-green-50 text-green-700":"bg-yellow-50 text-yellow-700"}`}>{inv.status==="paid"?"Pagado":inv.status}</span></td></tr>))}</tbody></table></div>}
    </div>);
}
