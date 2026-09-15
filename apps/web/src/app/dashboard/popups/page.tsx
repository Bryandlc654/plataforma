"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface Site {
  id: string;
  name: string;
  subdomain: string | null;
}

type PopupMode = "text" | "image" | "both";
type PopupTrigger = "time" | "scroll" | "exit" | "immediate";
type PopupTemplate = "modal-center" | "modal-left" | "slide-right" | "banner-top" | "banner-bottom";

interface PopupContent {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
}

interface PopupTriggerConfig {
  type: PopupTrigger;
  delaySeconds?: number;
  scrollPercent?: number;
}

interface Popup {
  id: string;
  name: string;
  active: boolean;
  template: PopupTemplate;
  mode: PopupMode;
  trigger: PopupTriggerConfig;
  width?: string;
  content: PopupContent;
  createdAt: string;
  updatedAt: string;
}

const TEMPLATES: { value: PopupTemplate; label: string }[] = [
  { value: "modal-center", label: "Modal centrado" },
  { value: "modal-left", label: "Modal lateral izquierdo" },
  { value: "slide-right", label: "Deslizante derecho" },
  { value: "banner-top", label: "Banner superior" },
  { value: "banner-bottom", label: "Banner inferior" },
];

const TRIGGERS: { value: PopupTrigger; label: string }[] = [
  { value: "time", label: "Tiempo" },
  { value: "scroll", label: "Scroll" },
  { value: "exit", label: "Salida del cursor" },
  { value: "immediate", label: "Inmediato" },
];

function emptyPopup(): Popup {
  return {
    id: "",
    name: "",
    active: false,
    template: "modal-center",
    mode: "both",
    trigger: { type: "time", delaySeconds: 5, scrollPercent: 50 },
    width: "420px",
    content: { title: "", description: "", buttonText: "Sí, quiero", buttonUrl: "", imageUrl: "" },
    createdAt: "",
    updatedAt: "",
  };
}

export default function PopupsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false(pending));
  const [error, setError] = useState<string | null>(nullongoing);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [draft, setDraft] = useState<Popup>(emptyPopup);

  const loadPopups = useCallback(
    async (siteId: string) => {
      try {
        const d: any = await api.get(`/popups/sites/${siteId}`);
        setPopups(d?.items || d || []);
        setError(null);
      } catch {
        setError("No se pudieron cargar los popups. Revisa los permisos del módulo.");
      }
    },
    []
  );

  const loadSites = useCallback(async () => {
    try {
      const res: any = await api.get("/sites");
      const list = (res?.data?.items || res?.items || res || []) as Site[];
      setSites(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
        loadPopups(list[0].id);
      }
    } catch {
      // sin sitios
    } finally {
      setLoading(false);
    }
  }, [loadPopups, selectedId]);

  useEffect(() => { loadSites(); }, [loadSites]);

  const handleSelectSite = (id: string) => {
    setSelectedId(id);
    setEditing(null);
    loadPopups(id);
  };

  const startEdit = (p?: Popup) => {
    setDraft(p ? { ...p, content: { ...p.content } } : emptyPopup());
    setEditing(p ? p : { ...emptyPopup(), id: "" });
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    try {
      if (editing?.id) {
        await api.put(`/popups/sites/${selectedId}/${editing.id}`, draft);
      } else {
        await api.post(`/popups/sites/${selectedId}`, draft);
      }
      await loadPopups(selectedId);
      setEditing(null);
      toast.success("Popup guardado");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al guardar el popup");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (p: Popup) => {
    const next = { ...p, active: !p.active };
    try {
      await api.put(`/popups/sites/${selectedId}/${p.id}`, { active: next.active });
      setPopups((prev) => prev.map((x) => (x.id === p.id ? next : x)));
    } catch {
      setError("No se pudo cambiar el estado del popup.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este popup?")) return;
    try {
      await api.delete(`/popups/sites/${selectedId}/${id}`);
      setPopups((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setError("No se pudo eliminar el popup.");
    }
  };

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Popups</h1>
            <p className="mt-1 text-sm text-slate-500">
              Crea ventanas emergentes para tu web pública: tiempo, scroll, tamaño, imagen o texto.
            </p>
          </div>
        </header>

        <div className="mt-6">
          <label className="label">Sitio web</label>
          <select
            value={selectedId}
            onChange={(e) => handleSelectSite(e.target.value)}
            className="input-field max-w-md"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Popups ({popups.length})</h2>
          <button onClick={() => startEdit()} className="btn-primary">+ Nuevo popup</button>
        </div>

        {loading ? (
          <div className="mt-4 animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : popups.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="text-slate-500">Aún no tienes popups en este sitio.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {popups.map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <button
                  onClick={() => toggle(p)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${p.active ? "bg-emerald-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${p.active ? "left-[22px]" : "left-0.5"}`} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {p.name || "Sin nombre"}
                    <span className={`ml-2 text-[10px] font-semibold uppercase ${p.active ? "text-emerald-600" : "text-slate-400"}`}>
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {TEMPLATES.find((t) => t.value === p.template)?.label} ·{" "}
                    {TRIGGERS.find((t) => t.value === p.trigger?.type)?.label}{" "}
                    {p.trigger?.type === "time" && p.trigger.delaySeconds ? `(${p.trigger.delaySeconds}s)` : ""} · {" "}
                    {p.mode === "text" ? "Solo texto" : p.mode === "image" ? "Solo imagen" : "Texto + imagen"}
                  </div>
                </div>
                <button onClick={() => startEdit(p)} className="btn-secondary text-sm">Editar</button>
                <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700">Eliminar</button>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                  {editing.id ? "Editar popup" : "Nuevo popup"}
                </h3>
                <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="label">Nombre interno</label>
                  <input className="input-field" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="p. ej. Oferta de lanzamiento" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Plantilla</label>
                    <select className="input-field" value={draft.template} onChange={(e) => setDraft({ ...draft, template: e.target.value as PopupTemplate })}>
                      {TEMPLATES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Contenido</label>
                    <select className="input-field" value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value as PopupMode })}>
                      <option value="text">Solo texto</option>
                      <option value="image">Solo imagen</option>
                      <option value="both">Texto + imagen</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label">Cuándo aparece</label>
                    <select
                      className="input-field"
                      value={draft.trigger.type}
                      onChange={(e) => setDraft({ ...draft, trigger: { ...draft.trigger, type: e.target.value as PopupTrigger } })}
                    >
                      {TRIGGERS.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                    </select>
                  </div>
                  {draft.trigger.type === "time" && (
                    <div>
                      <label className="label">Segundos de espera</label>
                      <input
                        type="number" min={0} className="input-field"
                        value={draft.trigger.delaySeconds ?? 5}
                        onChange={(e) => setDraft({ ...draft, trigger: { ...draft.trigger, delaySeconds: Number(e.target.value) } })}
                      />
                    </div>
                  )}
                  {draft.trigger.type === "scroll" && (
                    <div>
                      <label className="label">% de scroll</label>
                      <input
                        type="number" min={5} max={100} className="input-field"
                        value={draft.trigger.scrollPercent ?? 50}
                        onChange={(e) => setDraft({ ...draft, trigger: { ...draft.trigger, scrollPercent: Number(e.target.value) } })}
                      />
                    </div>
                  )}
                  <div>
                    <label className="label">Ancho</label>
                    <select className="input-field" value={draft.width || "420px"} onChange={(e) => setDraft({ ...draft, width: e.target.value })}>
                      <option value="340px">Estrecho (340px)</option>
                      <option value="420px">Medio (420px)</option>
                      <option value="560px">Ancho (560px)</option>
                    </select>
                  </div>
                </div>

                {(draft.mode === "text" || draft.mode === "both") && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Título</label>
                      <input className="input-field" value={draft.content.title || ""} onChange={(e) => setDraft({ ...draft, content: { ...draft.content, title: e.target.value } })} placeholder="¡No te pierdas esta oferta!" />
                    </div>
                    <div>
                      <label className="label">Descripción</label>
                      <textarea className="input-field resize-none" rows={2} value={draft.content.description || ""} onChange={(e) => setDraft({ ...draft, content: { ...draft.content, description: e.target.value } })} placeholder="Un texto breve que invite a la acción." />
                    </div>
                  </div>
                )}

                {(draft.mode === "image" || draft.mode === "both") && (
                  <div>
                    <label className="label">URL de la imagen</label>
                    <input className="input-field" value={draft.content.imageUrl || ""} onChange={(e) => setDraft({ ...draft, content: { ...draft.content, imageUrl: e.target.value } })} placeholder="https://… (o pégalo desde Archivos Media)" />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Texto del botón</label>
                    <input className="input-field" value={draft.content.buttonText || ""} onChange={(e) => setDraft({ ...draft, content: { ...draft.content, buttonText: e.target.value } })} placeholder="Sí, quiero" />
                  </div>
                  <div>
                    <label className="label">Link del botón</label>
                    <input className="input-field" value={draft.content.buttonUrl || ""} onChange={(e) => setDraft({ ...draft, content: { ...draft.content, buttonUrl: e.target.value } })} placeholder="https://… o /pagina" />
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-4 w-4" />
                    Activar este popup
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
                <button onClick={save} disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : "Guardar popup"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
