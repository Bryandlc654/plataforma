"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

interface KbAdminArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string | null;
  content: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_CATEGORIES = [
  "Comenzar",
  "Dominio",
  "Sitio Web",
  "Blog",
  "SEO",
  "E-commerce",
  "Media",
  "Facturación",
];

const EMPTY_FORM = {
  title: "",
  category: DEFAULT_CATEGORIES[0],
  slug: "",
  excerpt: "",
  content: "",
  isPublished: true,
  sortOrder: 0,
};

type FormState = typeof EMPTY_FORM;

export default function KnowledgeBaseAdminPage() {
  const [articles, setArticles] = useState<KbAdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<KbAdminArticle | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/knowledge-base/all");
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : data?.items || [];
      setArticles(
        list.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          category: a.category,
          excerpt: a.excerpt,
          content: a.content || "",
          isPublished: a.isPublished !== false,
          sortOrder: a.sortOrder || 0,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        }))
      );
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const notify = (kind: "success" | "error", message: string) => setToast({ kind, message });

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startEdit = (a: KbAdminArticle) => {
    setEditing(a);
    setForm({
      title: a.title,
      category: a.category,
      slug: a.slug,
      excerpt: a.excerpt || "",
      content: a.content || "",
      isPublished: a.isPublished,
      sortOrder: a.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validate = () => {
    if (form.title.trim().length < 3) return "El título debe tener al menos 3 caracteres";
    if (form.content.trim().length < 10) return "El contenido debe tener al menos 10 caracteres";
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      notify("error", err);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt.trim() || undefined,
        content: form.content,
        isPublished: form.isPublished,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing) {
        await api.put(`/knowledge-base/${editing.id}`, payload);
      } else {
        await api.post("/knowledge-base", payload);
      }
      notify("success", editing ? "Artículo actualizado" : "Artículo creado");
      setForm(EMPTY_FORM);
      setEditing(null);
      fetchAll();
    } catch (e: any) {
      notify("error", e?.response?.data?.message || "Error al guardar el artículo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (a: KbAdminArticle) => {
    if (!window.confirm(`¿Eliminar el artículo "${a.title}"?`)) return;
    try {
      await api.delete(`/knowledge-base/${a.id}`);
      notify("success", "Artículo eliminado");
      fetchAll();
    } catch (e: any) {
      notify("error", e?.response?.data?.message || "Error al eliminar");
    }
  };

  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...articles.map((a) => a.category)]));

  return (
    <main className="mx-auto w-full max-w-5xl p-6 lg:p-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Base de Conocimientos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona los artículos de ayuda que ven los owners de la plataforma.
          </p>
        </div>
        <button onClick={startCreate} className="btn-primary text-sm">
          + Nuevo artículo
        </button>
      </div>

      <div className="card mb-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Título</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Cómo conectar tu dominio"
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Slug (opcional, se genera solo)</label>
            <input
              className="input-field"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="conectar-dominio"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Orden</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                Publicado
              </label>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Resumen (tarjeta)</label>
            <input
              className="input-field"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              placeholder="Breve descripción que se muestra en la tarjeta del artículo"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Contenido (Markdown)</label>
            <textarea
              className="input-field resize-none font-mono text-xs"
              rows={10}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={"## Título de sección\n\nPaso a paso:\n\n1. Accede a...\n2. Haz clic en...\n\n**Negritas**, *cursivas*, `código`\n\n```\nbloque de código\n```"}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear artículo"}
          </button>
          {(editing || form.title || form.content) && (
            <button onClick={startCreate} className="btn-ghost text-sm">
              Cancelar
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Cargando artículos...</p>
      ) : articles.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-slate-500">Aún no hay artículos. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <div key={a.id} className="card flex flex-wrap items-center gap-3 p-4">
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  a.isPublished ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {a.isPublished ? "Publicado" : "Borrador"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-400">
                  {a.category}
                  {a.excerpt ? ` · ${a.excerpt}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(a)} className="btn-secondary px-3 py-1.5 text-xs">
                  Editar
                </button>
                <button onClick={() => handleDelete(a)} className="btn-ghost px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.kind === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {toast.kind === "success" ? "check_circle" : "error"}
          </span>
          {toast.message}
        </div>
      )}
    </main>
  );
}