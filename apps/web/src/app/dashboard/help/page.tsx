"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Markdown from "@/components/kb/markdown";

interface KbArticle {
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

export default function HelpPage() {
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [selected, setSelected] = useState<KbArticle | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes]: any[] = await Promise.all([
        api.get("/knowledge-base"),
        api.get("/knowledge-base/categories"),
      ]);
      const a = aRes?.data || aRes;
      const c = cRes?.data || cRes;
      setArticles(Array.isArray(a) ? a : []);
      setCategories(c?.counts || []);
    } catch {
      setArticles([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = useMemo(
    () => (activeCategory === "Todos" ? articles : articles.filter((a) => a.category === activeCategory)),
    [articles, activeCategory]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, KbArticle[]>();
    for (const a of filtered) {
      const list = map.get(a.category) || [];
      list.push(a);
      map.set(a.category, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const openArticle = async (article: KbArticle) => {
    try {
      const res: any = await api.get(`/knowledge-base/${article.slug}`);
      const detail = res?.data || res;
      setSelected(detail || article);
    } catch {
      setSelected(article);
    }
  };

  if (selected) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6 lg:p-10">
        <button
          onClick={() => setSelected(null)}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-primary-700"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver a la base de conocimientos
        </button>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700">
            {selected.category}
          </span>
          <span className="text-[11px] text-slate-400">
            Actualizado {new Date(selected.updatedAt || selected.createdAt).toLocaleDateString("es-EC")}
          </span>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-slate-900 lg:text-3xl">{selected.title}</h1>

        <div className="card">
          <Markdown>{selected.content}</Markdown>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl p-6 lg:p-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Base de Conocimientos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Guías y tutoriales para sacar el máximo provecho a tu plataforma: dominios, sitios web, blog, SEO y más.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("Todos")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === "Todos"
              ? "bg-primary-600 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Todos
        </button>
        {categories.map((c) => (
          <button
            key={c.name}
            onClick={() => setActiveCategory(c.name)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === c.name
                ? "bg-primary-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {c.name}
            <span className={`ml-1.5 text-xs ${activeCategory === c.name ? "text-primary-100" : "text-slate-400"}`}>
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Cargando artículos...</p>
      ) : filtered.length === 0 ? (
        <div className="card py-12 text-center">
          <p className="text-slate-500">No hay artículos en esta categoría todavía.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">{category}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => openArticle(a)}
                    className="card group flex flex-col gap-1 text-left transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-primary-700">{a.title}</h3>
                    </div>
                    {a.excerpt && <p className="text-xs leading-relaxed text-slate-500">{a.excerpt}</p>}
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-700">
                      Leer artículo
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}