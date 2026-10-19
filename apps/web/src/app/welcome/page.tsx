"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { BrandMark } from "@/components/auth/auth-flow";
import api from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  currency?: string;
  maxSites: number;
  maxUsers: number;
}

const GOALS = [
  { id: "business", label: "Sitio web para mi negocio" },
  { id: "store", label: "Vender productos online" },
  { id: "bookings", label: "Recibir reservas o citas" },
  { id: "portfolio", label: "Portafolio o marca personal" },
  { id: "landing", label: "Página para captar clientes" },
  { id: "migrate", label: "Trasladar un sitio existente" },
];

const fmtDate = (d: Date) => d.toLocaleDateString("es", { day: "numeric", month: "short" });

export default function WelcomePage() {
  const router = useRouter();
  const { tenantId, hasHydrated, ensureSession, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState<"payment" | "goals">("payment");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planSlug, setPlanSlug] = useState<string>("");
  const [goals, setGoals] = useState<string[]>(["business"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    (async () => {
      if (!(await ensureSession())) router.replace("/login");
    })();
  }, [hasHydrated, ensureSession, router, isAuthenticated]);

  useEffect(() => {
    api
      .get("/plans")
      .then((res: any) => {
        const list: Plan[] = (res.data || res || []).filter((p: Plan) => Number(p.price) > 0);
        setPlans(list);
        if (list[0]) setPlanSlug(list[0].slug);
      })
      .catch(() => setPlans([]));
  }, []);

  const plan = useMemo(() => plans.find((p) => p.slug === planSlug), [plans, planSlug]);
  const trialEnd = useMemo(() => new Date(Date.now() + 3 * 86400000), []);

  const startPayment = async () => {
    if (!planSlug) return;
    setBusy(true);
    setError(null);
    try {
      const res: any = await api.post("/billing/payment-link", { planSlug });
      const data = res.data || res;
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setError("No pudimos abrir la pasarela de pago.");
    } catch (err: any) {
      setError(err.response?.data?.message || "No pudimos abrir la pasarela de pago. Puedes omitir este paso.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async (skipGoals = false) => {
    setBusy(true);
    try {
      if (tenantId) {
        await api.put(`/tenants/${tenantId}/settings`, {
          onboarding: { completed: true, goals: skipGoals ? [] : goals },
        });
      }
    } catch {
      // No bloquea: el panel sigue funcionando aunque no se guarden las preferencias.
    }
    router.replace(goals.includes("store") && !skipGoals ? "/dashboard?setup=store" : "/dashboard");
  };

  const toggleGoal = (id: string) =>
    setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));

  return (
    <div className="sp-dark-screen flex flex-col">
      <header className="flex items-center justify-between px-8 py-6">
        <BrandMark />
        <button
          onClick={() => (step === "payment" ? setStep("goals") : finish(true))}
          className="sp-btn-light"
        >
          Omitir
        </button>
      </header>

      {step === "payment" ? (
        <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-6">
          <div className="grid w-full max-w-[820px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] md:grid-cols-2">
            <div className="flex flex-col p-10">
              <h1 className="text-[30px] font-medium leading-tight tracking-tight">
                Empieza gratis,
                <br />
                sigue desde {plan ? `${Number(plan.price)} $` : "poco"}
              </h1>
              <dl className="mt-10 divide-y divide-white/10 text-[15px]">
                <div className="flex justify-between py-4">
                  <dt className="text-white/70">Hoy</dt>
                  <dd>3 días gratis</dd>
                </div>
                <div className="flex justify-between py-4">
                  <dt className="text-white/70">{fmtDate(trialEnd)}</dt>
                  <dd>{plan ? `${Number(plan.price)} $/mes · plan ${plan.name}` : "Elige un plan"}</dd>
                </div>
                <div className="flex justify-between py-4">
                  <dt className="text-white/70">Siempre</dt>
                  <dd>Cancela en cualquier momento</dd>
                </div>
              </dl>
            </div>

            <div className="m-2 rounded-[22px] bg-white p-6 text-[#303030]">
              <p className="mb-3 text-sm font-semibold">Elige tu plan</p>
              <div className="space-y-2">
                {plans.length === 0 && (
                  <p className="rounded-xl bg-[#f1f2f3] p-4 text-sm text-[#616161]">
                    Los planes de pago no están disponibles por ahora. Puedes omitir este paso y empezar tu prueba.
                  </p>
                )}
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlanSlug(p.slug)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                      planSlug === p.slug ? "border-black ring-1 ring-black" : "border-[#c9cccf] hover:border-[#8a8a8a]"
                    }`}
                  >
                    <span>
                      <span className="block font-semibold">{p.name}</span>
                      <span className="text-xs text-[#616161]">
                        {p.maxSites} {p.maxSites === 1 ? "sitio" : "sitios"} · {p.maxUsers}{" "}
                        {p.maxUsers === 1 ? "usuario" : "usuarios"}
                      </span>
                    </span>
                    <span className="font-semibold">{Number(p.price)} $/mes</span>
                  </button>
                ))}
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <button onClick={startPayment} disabled={busy || !plan} className="sp-btn mt-5">
                {busy ? "Abriendo pasarela..." : "Agregar método de pago"}
              </button>
              <button onClick={() => setStep("goals")} className="sp-link mt-3 block w-full text-center">
                Omitir por ahora
              </button>
              <p className="mt-4 text-center text-xs leading-relaxed text-[#8a8a8a]">
                No se te cobra durante la prueba. Si no agregas un método de pago, tu sitio seguirá disponible
                hasta que termine la prueba.
              </p>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex flex-1 flex-col items-center px-4 pb-16 pt-8">
          <h1 className="text-center text-[30px] font-medium tracking-tight">¿Qué quieres crear?</h1>
          <p className="mt-2 text-center text-lg text-white/60">
            Selecciona todo lo que corresponda. Personalizaremos tu configuración.
          </p>
          <div className="sp-card mt-10 w-full max-w-[520px] !p-6">
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="sp-chip"
                  data-on={goals.includes(g.id)}
                  onClick={() => toggleGoal(g.id)}
                >
                  <span aria-hidden>{goals.includes(g.id) ? "✓" : "+"}</span>
                  {g.label}
                </button>
              ))}
            </div>
            <button onClick={() => finish(false)} disabled={busy} className="sp-btn mt-6 !h-12 !rounded-2xl">
              {busy ? "Preparando tu panel..." : "Continuar"}
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
