"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineArrowLeft, HiOutlineDesktopComputer, HiOutlineDeviceMobile, HiOutlineEye, HiOutlinePlus,
  HiOutlineSearch, HiOutlineTemplate, HiOutlineX,
} from "react-icons/hi";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface Category { id: string; name: string; slug: string; }
interface Template { id: string; name: string; description?: string | null; thumbnail?: string | null; category: Category | null; _count: { pages: number }; }

/** Qué buscar en cada plantilla según lo que el cliente dijo que quiere crear. */
const GOAL_MATCH: Record<string, { label: string; re: RegExp }> = {
  store: { label: "vender productos online", re: /e-?commerce|tienda|store|shop|venta|catálogo|catalogo/i },
  bookings: { label: "recibir reservas o citas", re: /reserva|cita|booking|salon|salón|spa|restaurante|cl[ií]nica|agenda/i },
  portfolio: { label: "mostrar tu portafolio", re: /portafolio|portfolio|creativ|fotograf|dise[ñn]o/i },
  landing: { label: "captar clientes", re: /landing|captaci|lead|campa[ñn]a/i },
};

const btnPrimary = "inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-[color:color-mix(in_srgb,var(--color-primary)_88%,white)] to-[color:var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60";

export default function NewSitePage() {
  const router = useRouter();
  const tenant = useAuthStore((s) => s.tenant);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<Template | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [creating, setCreating] = useState<string | null>(null); // nombre mostrado mientras se crea
  const [stage, setStage] = useState<"creating" | "opening">("creating");
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("goals");
    if (g) setGoals(g.split(",").filter((x) => GOAL_MATCH[x]));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [tplRes, catRes]: any = await Promise.all([api.get("/templates"), api.get("/templates/categories").catch(() => ({ data: [] }))]);
        setTemplates(tplRes.data || tplRes);
        setCategories(catRes.data || catRes);
      } catch { setError("No se pudieron cargar las plantillas."); }
      finally { setLoadingList(false); }
    })();
  }, []);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreview(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  const isRecommended = (t: Template) =>
    goals.some((g) => GOAL_MATCH[g].re.test(`${t.name} ${t.description || ""} ${t.category?.name || ""}`));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = templates.filter((t) =>
      (activeCategory === "all" || t.category?.id === activeCategory) &&
      (!q || t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || (t.category?.name || "").toLowerCase().includes(q)));
    // Las recomendadas van primero; nunca se oculta nada.
    return [...list].sort((a, b) => Number(isRecommended(b)) - Number(isRecommended(a)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, activeCategory, search, goals]);

  /** Crea el sitio al instante: el nombre se puede cambiar luego dentro del editor. */
  const createSite = async (template: Template | null) => {
    if (creating) return;
    setError("");
    setLimitReached(false);
    setStage("creating");
    setCreating(template?.name || "Página en blanco");
    try {
      const name = tenant?.name || template?.name || "Mi sitio";
      const res: any = await api.post("/sites", { name, templateId: template?.id });
      const site = res.data || res;
      setStage("opening");
      router.push(`/dashboard/sites/${site.id}`);
    } catch (err: any) {
      setCreating(null);
      setPreview(null);
      const msg: string = err.response?.data?.message || "No se pudo crear el sitio. Inténtalo de nuevo.";
      setLimitReached(/l[ií]mite/i.test(msg));
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] pb-16">
      <div className="border-b border-[#e3e3e3] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/dashboard/sites" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[#616161] hover:text-[color:var(--color-primary)]">
            <HiOutlineArrowLeft className="h-4 w-4" /> Mis sitios
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-[#303030] sm:text-xl">Elige una plantilla</h1>
          <p className="mt-1 text-sm text-[#616161] sm:text-base">Todo se puede cambiar después: textos, imágenes, colores y secciones.</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0">
              {[{ id: "all", name: "Todas" }, ...categories].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === c.id ? "bg-[color:var(--color-primary)] text-white" : "border border-[#e3e3e3] bg-white text-[#616161] hover:border-[color:color-mix(in_srgb,var(--color-primary)_40%,transparent)]"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <div className="relative sm:w-72">
              <HiOutlineSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar plantilla…"
                className="w-full rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_15%,transparent)]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {goals.length > 0 && !search && (
          <p className="mb-6 text-sm text-[#616161]">
            Ordenamos las plantillas para <strong className="text-[#303030]">{goals.map((g) => GOAL_MATCH[g].label).join(" y ")}</strong>. Puedes elegir cualquiera.
          </p>
        )}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <span className="flex flex-shrink-0 items-center gap-3">
              {limitReached && <Link href="/dashboard/billing" className="font-semibold underline">Ver planes</Link>}
              <button onClick={() => setError("")} aria-label="Cerrar aviso"><HiOutlineX className="h-4 w-4" /></button>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Empezar en blanco */}
          {!search && activeCategory === "all" && (
            <button
              onClick={() => createSite(null)}
              className="group flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#d4d4d4] bg-white p-6 text-center transition hover:border-[color:var(--color-primary)] hover:bg-[color:color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[color:var(--color-primary)]"><HiOutlinePlus className="h-6 w-6" /></span>
              <span className="font-semibold text-[#303030]">Empezar desde cero</span>
              <span className="text-sm text-[#616161]">Una página en blanco para armar a tu manera.</span>
            </button>
          )}

          {loadingList && Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[300px] animate-pulse rounded-2xl bg-[#e3e3e3]/70" />)}

          {filtered.map((t) => (
            <div key={t.id} className="group flex flex-col overflow-hidden rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_0_rgba(0,0,0,0.07)] bg-white transition hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--color-primary)_30%,transparent)] hover:shadow-xl">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-[#ebebeb] bg-[#f1f1f1]">
                {t.thumbnail ? (
                  <div className="absolute inset-0 bg-cover bg-top transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${t.thumbnail})` }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[color:color-mix(in_srgb,var(--color-primary)_5%,transparent)] to-[color:color-mix(in_srgb,var(--color-primary)_15%,transparent)]"><HiOutlineTemplate className="h-12 w-12 text-[color:color-mix(in_srgb,var(--color-primary)_30%,transparent)]" /></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[color:color-mix(in_srgb,var(--color-primary)_55%,transparent)] opacity-0 transition-opacity group-hover:opacity-100 max-sm:items-end max-sm:bg-transparent max-sm:pb-3 max-sm:opacity-100">
                  <button onClick={() => { setDevice("desktop"); setPreview(t); }} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#303030] shadow hover:bg-[#f7f7f7]"><HiOutlineEye className="h-4 w-4" />Vista previa</button>
                  <button onClick={() => createSite(t)} className={btnPrimary}>Usar</button>
                </div>
                <div className="absolute left-3 top-3 flex gap-1.5">
                  {isRecommended(t) && <span className="rounded-full bg-[color:var(--color-secondary)] px-2.5 py-1 text-xs font-semibold text-[color:var(--color-on-secondary,#201b51)] shadow-sm">Recomendada</span>}
                  {t.category && <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-[#303030] shadow-sm">{t.category.name}</span>}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-semibold text-[#303030]">{t.name}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-[#616161]">{t.description || "Diseño profesional listo para usar."}</p>
                <p className="mt-3 text-xs font-medium text-[#8a8a8a]">{t._count?.pages || 0} página{(t._count?.pages || 0) === 1 ? "" : "s"}</p>
              </div>
            </div>
          ))}
        </div>

        {!loadingList && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-semibold text-[#303030]">No encontramos plantillas con ese criterio</p>
            <button onClick={() => { setSearch(""); setActiveCategory("all"); }} className="mt-3 text-sm font-medium text-[color:var(--color-primary)] hover:underline">Ver todas</button>
          </div>
        )}
      </div>

      {/* VISTA PREVIA */}
      {preview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a]/60 backdrop-blur-sm sm:p-6" onClick={() => setPreview(null)}>
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3e3e3] px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#303030]">{preview.name}</p>
                {preview.category && <p className="text-xs text-[#8a8a8a]">{preview.category.name}</p>}
              </div>
              <div className="flex items-center rounded-lg border border-[#e3e3e3] p-0.5 max-sm:hidden">
                {([["desktop", HiOutlineDesktopComputer], ["mobile", HiOutlineDeviceMobile]] as const).map(([k, Icon]) => (
                  <button key={k} onClick={() => setDevice(k)} className={`flex h-7 w-9 items-center justify-center rounded-md ${device === k ? "bg-[color:var(--color-primary)] text-white" : "text-[#616161] hover:bg-[#f1f1f1]"}`} title={k === "desktop" ? "Escritorio" : "Móvil"}><Icon className="h-4 w-4" /></button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => createSite(preview)} disabled={!!creating} className={btnPrimary}>Usar esta plantilla</button>
                <button onClick={() => setPreview(null)} className="rounded-lg p-2 text-[#8a8a8a] hover:bg-[#f1f1f1] hover:text-[#616161]" aria-label="Cerrar"><HiOutlineX className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-[#e3e3e3]/70 p-0 sm:p-4">
              <iframe
                key={`${preview.id}-${device}`}
                src={`/templates/${preview.id}?embed=1`}
                title={`Vista previa de ${preview.name}`}
                className={`mx-auto h-full bg-white transition-all ${device === "mobile" ? "w-[390px] max-w-full rounded-2xl shadow-xl ring-1 ring-[#d4d4d4]" : "w-full"}`}
              />
            </div>
          </div>
        </div>
      )}

      {/* CREANDO EL SITIO */}
      {creating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[color:color-mix(in_srgb,var(--color-primary)_90%,transparent)] p-4 text-center text-white backdrop-blur-sm">
          <div>
            <svg className="mx-auto mb-5 h-10 w-10 animate-spin text-[color:var(--color-secondary)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-lg font-semibold">{stage === "creating" ? "Creando tu sitio…" : "Abriendo el editor…"}</p>
            <p className="mt-1 text-sm text-white/70">{creating}</p>
          </div>
        </div>
      )}
    </div>
  );
}
