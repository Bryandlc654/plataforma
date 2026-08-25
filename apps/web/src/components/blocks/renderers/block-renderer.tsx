import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1")
  .replace(/\/api\/v1\/?$/i, "")
  .replace(/\/+$/, "");

function resolveMediaUrl(value: any): any {
  if (typeof value === "string") {
    if (value.startsWith("/uploads/")) return `${API_ORIGIN}${value}`;
    return value;
  }
  if (Array.isArray(value)) return value.map(resolveMediaUrl);
  if (value && typeof value === "object") {
    const out: any = {};
    for (const k of Object.keys(value)) out[k] = resolveMediaUrl(value[k]);
    return out;
  }
  return value;
}

function Dots({ total, active, onDot }: { total: number; active: number; onDot: (i: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDot(i)}
          className={`h-2.5 rounded-full transition-all ${i === active ? "w-7 bg-white" : "w-2.5 bg-white/40 hover:bg-white/60"}`}
          aria-label={`Slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

function DarkDots({ total, active, onDot }: { total: number; active: number; onDot: (i: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDot(i)}
          className={`h-2 rounded-full transition-all ${i === active ? "w-6 bg-slate-900" : "w-2 bg-slate-300 hover:bg-slate-400"}`}
          aria-label={`Slide ${i + 1}`}
        />
      ))}
    </div>
  );
}

export function BlockRenderer({ type, content }: { type: string; content: any }) {
  const c = resolveMediaUrl(content || {});
  const primary = c.primaryColor || "#2563EB";
  const secondary = c.secondaryColor || "#1e40af";

  // All hooks at top level (React rules of hooks)
  const slides = (c.slides && c.slides.length > 0) ? c.slides : [c];
  const [slideIdx, setSlideIdx] = useState(0);
  const hasHeroSlides = type === "hero" && slides.length > 1;
  useEffect(() => { if (!hasHeroSlides) return; const t = setInterval(() => setSlideIdx((p) => (p + 1) % slides.length), 5000); return () => clearInterval(t); }, [hasHeroSlides, slides.length]);

  const testItems = c.items || [];
  const testCols = c.columns || 3;
  const isTestCarousel = type === "testimonials" && c.carousel === true;
  const testSlidesPerView = testCols || 1;
  const [testIdx, setTestIdx] = useState(0);
  useEffect(() => { if (!isTestCarousel || testItems.length <= testSlidesPerView) return; const t = setInterval(() => setTestIdx((p) => (p + 1) % Math.ceil(testItems.length / testSlidesPerView)), 4000); return () => clearInterval(t); }, [isTestCarousel, testItems.length, testSlidesPerView]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (c.variant !== "rodriplast") return;
    const root = revealRef.current;
    if (!root) return;
    root.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-1, .reveal-2, .reveal-3").forEach((el) => el.classList.add("in-view"));
  }, [c.variant, c]);

  useEffect(() => {
    if (c.variant !== "rodriplast" || type !== "hero") return;
    const root = revealRef.current;
    if (!root) return;
    const slider = root.querySelector("#heroSlider");
    if (!slider) return;
    const slides = Array.from(slider.children) as HTMLElement[];
    if (slides.length <= 1) return;
    const dotsContainer = root.querySelector("#heroDots");
    if (!dotsContainer) return;
    let idx = 0;
    const dots: HTMLButtonElement[] = [];
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "w-2.5 h-2.5 rounded-full bg-white/30 transition-all duration-300 hover:bg-white/60";
      if (i === 0) { dot.classList.remove("bg-white/30"); dot.classList.add("bg-white", "scale-125"); }
      dot.addEventListener("click", () => {
        slides[idx].classList.remove("opacity-100");
        slides[idx].classList.add("opacity-0");
        idx = i;
        slides[idx].classList.remove("opacity-0");
        slides[idx].classList.add("opacity-100");
        updateDots();
      });
      dotsContainer.appendChild(dot);
      dots.push(dot);
    });
    function updateDots() {
      dots.forEach((dot, i) => {
        dot.classList.remove("bg-white", "scale-125");
        dot.classList.add("bg-white/30");
        if (i === idx) { dot.classList.remove("bg-white/30"); dot.classList.add("bg-white", "scale-125"); }
      });
    }
    const interval = setInterval(() => {
      slides[idx].classList.remove("opacity-100");
      slides[idx].classList.add("opacity-0");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.remove("opacity-0");
      slides[idx].classList.add("opacity-100");
      updateDots();
    }, 5000);
    return () => { clearInterval(interval); dots.forEach(d => d.remove()); };
  }, [c.variant, type, c]);

  if (c.variant === "prestige") {
    // Import from local lib directory since Vercel root doesn't have access to packages/
    const { getPrestigeHtml } = require("../../../lib/prestige-variants");
    const html = getPrestigeHtml(type, c);
    if (html) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: html }} 
          onSubmit={async (e) => {
            if (type !== "contact" && type !== "form") return;
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const data: Record<string, any> = {};
            formData.forEach((v, k) => { data[k] = v; });
            const tenantId = useAuthStore.getState().tenantId;
            const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (btn) btn.disabled = true;
            try {
              if (tenantId) await api.post(`/leads/submit/${tenantId}`, data);
              else await new Promise(res => setTimeout(res, 1000));
              form.innerHTML = `<div class="text-center p-8"><h3 class="font-bold text-xl text-green-600 mb-2">¡Enviado!</h3><p>Gracias por tu mensaje.</p></div>`;
            } catch (err) {
              if (btn) btn.disabled = false;
              alert("Error al enviar el formulario");
            }
          }}
        />
      );
    }
  }

  if (c.variant === "art-culinaire") {
    const { getArtCulinaireHtml } = require("../../../lib/art-culinaire-variants");
    const html = getArtCulinaireHtml(type, c);
    if (html) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: html }} 
          onSubmit={async (e) => {
            if (type !== "contact" && type !== "form") return;
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const data: Record<string, any> = {};
            formData.forEach((v, k) => { data[k] = v; });
            const tenantId = useAuthStore.getState().tenantId;
            const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (btn) btn.disabled = true;
            try {
              if (tenantId) await api.post(`/leads/submit/${tenantId}`, data);
              else await new Promise(res => setTimeout(res, 1000));
              form.innerHTML = `<div class="text-center p-8"><h3 class="font-bold text-xl text-green-600 mb-2">¡Enviado!</h3><p>Gracias por tu mensaje.</p></div>`;
            } catch (err) {
              if (btn) btn.disabled = false;
              alert("Error al enviar el formulario");
            }
          }}
        />
      );
    }
  }

  if (c.variant === "rodriplast") {
    const { getRodriplastHtml } = require("../../../lib/rodriplast-variants");
    let html = getRodriplastHtml(type, c);
    // In the editor the fixed header overlaps the project header; render it static here
    if (html && type === "header") {
      html = html.replace('class="fixed top-0 inset-x-0 z-50', 'class="relative top-0 inset-x-0 z-50');
    }
    if (html) {
      return (
        <div 
          ref={revealRef}
          dangerouslySetInnerHTML={{ __html: html }} 
          onSubmit={async (e) => {
            if (type !== "contact" && type !== "form") return;
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const data: Record<string, any> = {};
            formData.forEach((v, k) => { data[k] = v; });
            const tenantId = useAuthStore.getState().tenantId;
            const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (btn) {
              btn.innerHTML = '¡Mensaje enviado! <i class="bi bi-check-lg h-4 w-4"></i>'; 
              btn.style.background = '#16a34a';
              btn.disabled = true;
            }
            try {
              if (tenantId) await api.post(`/leads/submit/${tenantId}`, data);
              else await new Promise(res => setTimeout(res, 1000));
            } catch (err) {
              if (btn) btn.disabled = false;
              alert("Error al enviar el formulario");
            }
          }}
        />
      );
    }
  }

  switch (type) {
    case "hero": {
      return (
        <section id={c.anchor || undefined} className="relative overflow-hidden text-white min-h-[60vh] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}>
          {slides.map((slide: any, idx: number) => {
            const isActive = slideIdx === idx;
            return (
              <div key={idx} className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                {/* Background image layer */}
                {slide.backgroundImage && (
                  <>
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.backgroundImage})` }} />
                    <div className="absolute inset-0 bg-black/50" />
                  </>
                )}
                {!slide.backgroundImage && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_60%)]" />}

                {/* Content */}
                <div className="relative z-10 px-6 py-16 sm:py-24 max-w-3xl mx-auto text-center">
                  {slide.kicker && (
                    <p className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold tracking-wider ring-1 ring-white/20 mb-6">
                      {slide.kicker}
                    </p>
                  )}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                    {slide.title || "Título de tu negocio"}
                  </h1>
                  {slide.subtitle && (
                    <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
                      {slide.subtitle}
                    </p>
                  )}
                  <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    {slide.buttonText && (
                      <a href={slide.buttonUrl || "#"} className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg hover:shadow-xl hover:bg-white/95 transition-all">
                        {slide.buttonText}
                      </a>
                    )}
                    {slide.secondaryButtonText && (
                      <a href={slide.secondaryButtonUrl || "#"} className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/20 transition-all">
                        {slide.secondaryButtonText}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {hasHeroSlides && (
            <div className="absolute bottom-6 left-0 right-0 z-20">
              <Dots total={slides.length} active={slideIdx} onDot={setSlideIdx} />
            </div>
          )}
        </section>
      );
    }

    case "services":
      return (
        <section id={c.anchor || "services"} className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                {c.title || "Nuestros servicios"}
              </h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-700 font-semibold">
                      {item.icon ? <span className="text-xl">{item.icon}</span> : <span className="text-sm">{String(i + 1).padStart(2, "0")}</span>}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.title || "Servicio"}</h3>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc || ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "faq":
      return (
        <section id={c.anchor || undefined} className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                {c.title || "Preguntas frecuentes"}
              </h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            <div className="mt-10 space-y-3">
              {(c.items || []).map((item: any, i: number) => (
                <details key={i} className="group border border-slate-200 rounded-2xl bg-white overflow-hidden">
                  <summary className="px-5 py-4 cursor-pointer font-semibold text-slate-900 select-none hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                    {item.question}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      );

    case "cta":
      return (
        <section
          id={c.anchor || "contact"}
          className="relative overflow-hidden text-white"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/25" />
          <div className="relative px-6 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{c.title || "¿Listo para dar el siguiente paso?"}</h2>
              <p className="mt-3 text-white/90 max-w-2xl mx-auto">{c.subtitle || "Agenda una llamada o escribe por WhatsApp. Respondemos rápido."}</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                {c.buttonText && (
                  <a href={c.buttonUrl || "#"} className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 hover:bg-white/95 transition-colors">
                    {c.buttonText}
                  </a>
                )}
                {c.secondaryButtonText && (
                  <a href={c.secondaryButtonUrl || "#"} className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/15 transition-colors">
                    {c.secondaryButtonText}
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      );

    case "testimonials": {
      const items = c.items || [];
      const cols = c.columns || 3;
      const gridClass = cols === 1 ? "grid-cols-1 max-w-lg mx-auto" : cols === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : "sm:grid-cols-2 lg:grid-cols-3";
      const visibleItems = isTestCarousel
        ? items.slice(testIdx * testSlidesPerView, testIdx * testSlidesPerView + testSlidesPerView)
        : items;

      const totalSlides = isTestCarousel ? Math.ceil(items.length / testSlidesPerView) : 1;

      return (
        <section id={c.anchor || undefined} className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{c.title || "Testimonios"}</h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            <div className={`mt-12 grid ${isTestCarousel ? gridClass + " gap-6 transition-all duration-500" : gridClass + " gap-6"}`}>
              {visibleItems.map((item: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 text-amber-500">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                  <p className="mt-4 text-slate-700 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-900/5 flex items-center justify-center text-slate-700 font-semibold">
                      {(item.name?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-500">{item.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {isTestCarousel && <DarkDots total={totalSlides} active={testIdx} onDot={setTestIdx} />}
          </div>
        </section>
      );
    }

    case "gallery":
      return (
        <section id={c.anchor || undefined} className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{c.title || "Galería"}</h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
              {(c.images || []).map((img: any, i: number) => (
                <Image
                  key={i}
                  src={img.url || `https://placehold.co/600x400/2563EB/white?text=Imagen+${i + 1}`}
                  alt={img.alt || ""}
                  width={600}
                  height={400}
                  className="w-full h-44 sm:h-52 object-cover rounded-2xl border border-slate-200 hover:opacity-95 transition-opacity"
                />
              ))}
            </div>
          </div>
        </section>
      );

    case "stats":
      return (
        <section id={c.anchor || undefined} className="py-16 sm:py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{c.title || "Resultados"}</h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(c.items || []).map((it: any, i: number) => (
                <div key={i} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="text-3xl font-extrabold tracking-tight" style={{ color: primary }}>{it.value}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{it.label}</div>
                  {it.desc && <div className="mt-1 text-sm text-slate-600 leading-relaxed">{it.desc}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "portfolio":
      return (
        <section id={c.anchor || "portfolio"} className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{c.title || "Portafolio"}</h2>
                {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
              </div>
              {Array.isArray(c.categories) && c.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {c.categories.slice(0, 6).map((cat: any, i: number) => (
                    <span key={i} className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                      {String(cat)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(c.items || []).map((p: any, i: number) => (
                <a
                  key={i}
                  href={p.link || "#"}
                  className="group block rounded-2xl overflow-hidden border border-slate-200 bg-white hover:shadow-xl hover:border-slate-300 transition-all"
                >
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image
                      src={p.image || `https://placehold.co/1200x800/111827/FFFFFF?text=Proyecto`}
                      alt={p.title || ""}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/0 opacity-80" />
                    <div className="absolute left-4 right-4 bottom-4">
                      {p.category && (
                        <span className="inline-flex rounded-full bg-white/90 text-slate-800 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide border border-white/60">
                          {p.category}
                        </span>
                      )}
                      <div className="mt-2 text-white font-semibold text-lg leading-tight">{p.title}</div>
                    </div>
                  </div>
                  <div className="p-5">
                    {p.desc && <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>}
                    {Array.isArray(p.tags) && p.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {p.tags.slice(0, 4).map((t: any, j: number) => (
                          <span key={j} className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {String(t)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      );

    case "header": {
      const logoType = c.logoType || "text";
      const hasImage = logoType === "image" || logoType === "both";
      const hasText = logoType === "text" || logoType === "both";
      const variant = c.variant || "classic";

      const logoEl = (
        <div className="flex items-center gap-3">
          {hasImage && c.logoImage ? (
            <div className="relative h-8 sm:h-10 w-auto min-w-[40px]">
              <Image src={c.logoImage} alt={hasText ? c.logoText : "Logo"} fill className="object-contain !relative !h-8 sm:!h-10 !w-auto max-w-[160px]" sizes="160px" unoptimized />
            </div>
          ) : (
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-700 font-bold text-sm flex-shrink-0">{String(c.logoText || "A")[0].toUpperCase()}</div>
          )}
          {hasText && <div className="font-bold text-slate-900 text-sm sm:text-base">{c.logoText || "Tu marca"}</div>}
        </div>
      );

      const navLinks = (
        <nav className={`${menuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row gap-3 md:gap-6`}>
          {(c.links || []).map((link: any, i: number) => (
            <a key={i} href={link.url || "#"} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1 md:py-0">{link.label}</a>
          ))}
        </nav>
      );

      const ctaBtn = c.ctaText ? (
        <a href={c.ctaUrl || "#"} className="hidden md:inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">{c.ctaText}</a>
      ) : null;

      if (variant === "centered") {
        return (
          <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-between w-full md:justify-center">
                  <div className="md:hidden">{logoEl}</div>
                  <div className="hidden md:block">{logoEl}</div>
                  <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Menú">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}</svg>
                  </button>
                </div>
                <nav className={`${menuOpen ? "flex" : "hidden"} md:flex items-center gap-4 md:gap-8`}>
                  {(c.links || []).map((link: any, i: number) => (
                    <a key={i} href={link.url || "#"} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">{link.label}</a>
                  ))}
                  {ctaBtn && <div className="md:hidden">{ctaBtn}</div>}
                </nav>
                {ctaBtn && <div className="hidden md:block absolute right-6 top-4">{ctaBtn}</div>}
              </div>
            </div>
          </header>
        );
      }

      if (variant === "minimal") {
        return (
          <header className="sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              {logoEl}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Menú">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}</svg>
              </button>
              <nav className={`${menuOpen ? "flex" : "hidden"} md:flex items-center gap-4 md:gap-8`}>
                {(c.links || []).map((link: any, i: number) => (
                  <a key={i} href={link.url || "#"} className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">{link.label}</a>
                ))}
                {ctaBtn}
              </nav>
            </div>
          </header>
        );
      }

      // Classic
      return (
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap">
            {logoEl}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Menú">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}</svg>
            </button>
            <nav className={`${menuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row w-full md:w-auto mt-3 md:mt-0 gap-3 md:gap-6`}>
              {(c.links || []).map((link: any, i: number) => (<a key={i} href={link.url || "#"} className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors py-1 md:py-0">{link.label}</a>))}
            </nav>
            {ctaBtn && <div className="ml-4">{ctaBtn}</div>}
          </div>
        </header>
      );
    }

    case "footer":
      return (
        <footer className="bg-slate-950 text-slate-400">
          <div className="max-w-6xl mx-auto px-6 py-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <div>
              <h3 className="text-white font-semibold text-lg">{c.companyName || "Tu empresa"}</h3>
              <p className="mt-3 text-sm leading-relaxed">{c.description || "Descripción corta del negocio y propuesta de valor."}</p>
              {Array.isArray(c.social) && c.social.length > 0 && (
                <div className="mt-5 flex gap-3">
                  {c.social.slice(0, 5).map((s: any, i: number) => (
                    <a key={i} href={s.url || "#"} className="h-10 w-10 rounded-xl bg-white/5 ring-1 ring-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <span className="text-white/80 text-sm">{s.label?.[0] || "•"}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            {(c.columns || []).map((col: any, i: number) => (
              <div key={i}>
                <h4 className="text-white font-semibold text-sm">{col.title}</h4>
                <div className="mt-3 space-y-2">
                  {(col.links || []).map((link: any, j: number) => (
                    <a key={j} href={link.url || "#"} className="block text-sm hover:text-white transition-colors">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10">
            <div className="max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-500">
              {c.copyright || `© ${new Date().getFullYear()} Todos los derechos reservados.`}
            </div>
          </div>
        </footer>
      );

    case "whatsapp":
      return (
        <section className="py-8 px-6 bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-dashed border-green-200 bg-green-50/50 px-5 py-3">
              <div className="flex items-center justify-center rounded-full shadow-md" style={{ width: 48, height: 48, background: c.color || "#25D366" }}>
                <svg className="text-white" style={{ width: 24, height: 24 }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">Botón de WhatsApp</p>
                <p className="text-xs text-slate-400">{c.phone || "Sin número"} · {c.position === "bottom-left" ? "Izquierda" : "Derecha"}</p>
                {c.message && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">&quot;{c.message}&quot;</p>}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">Este botón aparece flotante en el sitio publicado, no en el editor.</p>
          </div>
        </section>
      );

    case "pricing":
      return (
        <section id={c.anchor || "pricing"} className="py-20 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{c.title || "Nuestros planes"}</h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {(c.plans || []).map((plan: any, i: number) => {
                const features = typeof plan.features === "string" ? plan.features.split(",").map((s: string) => s.trim()) : (plan.features || []);
                const highlighted = plan.highlighted === "true" || plan.highlighted === true;
                return (
                  <div key={i} className={`relative rounded-2xl p-6 sm:p-8 border-2 ${highlighted ? "border-slate-900 bg-white shadow-xl scale-[1.02]" : "border-slate-200 bg-white shadow-sm"}`}>
                    {highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-1 rounded-full">Popular</span>}
                    <h3 className="text-lg font-bold text-slate-900">{plan.name || "Plan"}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{plan.price || "$0"}</span>
                    </div>
                    {plan.description && <p className="mt-2 text-sm text-slate-600">{plan.description}</p>}
                    <ul className="mt-6 space-y-3">
                      {features.map((f: string, j: number) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                          <svg className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                    {plan.buttonText && (
                      <a href={plan.buttonUrl || "#"} className={`mt-8 block text-center rounded-xl py-3 text-sm font-semibold transition-colors ${highlighted ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}>
                        {plan.buttonText}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );

    case "team":
      return (
        <section id={c.anchor || "team"} className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{c.title || "Nuestro equipo"}</h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(c.members || []).map((m: any, i: number) => (
                <div key={i} className="text-center group">
                  <div className="relative mx-auto w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-slate-100 ring-2 ring-slate-100 group-hover:ring-slate-900/20 transition-all">
                    {m.image ? (
                      <Image src={m.image} alt={m.name || ""} fill className="object-cover" sizes="144px" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl">{(m.name?.[0] || "?").toUpperCase()}</div>
                    )}
                  </div>
                  <h3 className="mt-4 font-bold text-slate-900">{m.name}</h3>
                  <p className="text-sm text-slate-500">{m.role}</p>
                  {m.bio && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "features":
    case "benefits":
    case "process":
      return (
        <section id={c.anchor || "features"} className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{c.title || "¿Por qué elegirnos?"}</h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(c.items || []).map((item: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all group">
                  <div className="text-3xl mb-4">{item.icon || (<svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>)}</div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case "contact":
    case "form": {
      const fields = (c.fields || []) as any[];
      const tenantId = useAuthStore.getState().tenantId;
      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormState("loading");
        const formData = new FormData(e.currentTarget);
        const data: Record<string, any> = {};
        formData.forEach((v, k) => { data[k] = v; });
        
        try {
          if (tenantId) {
            await api.post(`/leads/submit/${tenantId}`, data);
          } else {
            // Preview sin tenantId (página de template): solo simula el envío.
            await new Promise(res => setTimeout(res, 1000));
          }
          setFormState("success");
        } catch {
          setFormState("error");
        }
      };
      return (
        <section id={c.anchor || "form"} className="py-20 px-6 bg-slate-50">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">{c.title || "Contáctanos"}</h2>
              {c.subtitle && <p className="mt-3 text-slate-600">{c.subtitle}</p>}
            </div>
            {formState === "success" ? (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center">
                <svg className="h-8 w-8 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <h3 className="font-semibold text-green-800">¡Enviado!</h3>
                <p className="text-sm text-green-600 mt-1">Gracias por tu mensaje. Te contactaremos pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="space-y-4">
                  {fields.map((field: any, i: number) => {
                    const isRequired = field.required === true || field.required === "true";
                    return (
                    <div key={i}>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        {field.label || field.name}
                        {isRequired && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      {field.type === "textarea" ? (
                        <textarea name={field.name} required={isRequired}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                          rows={4}
                        />
                      ) : (
                        <input type={field.type || "text"} name={field.name} required={isRequired}
                          className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        />
                      )}
                    </div>
                    );
                  })}
                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    {formState === "loading" ? "Enviando..." : c.buttonText || "Enviar"}
                  </button>
                  {formState === "error" && (
                    <p className="text-sm text-red-600 text-center">Error al enviar. Intenta de nuevo.</p>
                  )}
                </div>
              </form>
            )}
          </div>
        </section>
      );
    }

    case "review-form": {
      const [rating, setRating] = useState(5);
      const [hover, setHover] = useState(0);
      const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");

      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormState("loading");
        const fd = new FormData(e.currentTarget);
        try {
          await api.post("/reviews/public", {
            tenantId: c.tenantId || "",
            siteId: c.siteId || "",
            rating: Number(fd.get("rating")) || rating,
            authorName: fd.get("authorName"),
            authorEmail: fd.get("authorEmail") || undefined,
            content: fd.get("content"),
          });
          setFormState("success");
        } catch { setFormState("error"); }
      };

      return (
        <section id={c.anchor || undefined} className="py-12 sm:py-16 px-6">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-center mb-2">{c.title || "Déjanos tu opinión"}</h2>
            <p className="text-center text-slate-500 mb-8">{c.subtitle || "Valoramos tu experiencia con nosotros"}</p>
            {formState === "success" ? (
              <div className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center">
                <svg className="h-8 w-8 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <h3 className="font-semibold text-green-800">¡Gracias!</h3>
                <p className="text-sm text-green-600 mt-1">Tu opinión ha sido enviada. Será visible tras ser aprobada.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="space-y-5">
                  <div className="flex flex-col items-center gap-2">
                    <label className="text-sm font-semibold text-slate-700">Calificación</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button"
                          className={`text-3xl transition-colors ${star <= (hover || rating) ? "text-yellow-400" : "text-slate-300"}`}
                          onClick={() => { setRating(star); const hidden = document.getElementById("review-rating-hidden") as HTMLInputElement; if (hidden) hidden.value = String(star); }}
                          onMouseEnter={() => setHover(star)}
                          onMouseLeave={() => setHover(0)}
                        >★</button>
                      ))}
                    </div>
                    <input type="hidden" id="review-rating-hidden" name="rating" value={String(rating)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tu nombre <span className="text-red-400">*</span></label>
                    <input type="text" name="authorName" required className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tu correo <span className="text-slate-400 text-xs">(opcional)</span></label>
                    <input type="email" name="authorEmail" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Comentario <span className="text-red-400">*</span></label>
                    <textarea name="content" required rows={4} className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none" />
                  </div>
                  <button type="submit" disabled={formState === "loading"}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors">
                    {formState === "loading" ? "Enviando..." : "Enviar opinión"}
                  </button>
                  {formState === "error" && <p className="text-sm text-red-600 text-center">Error al enviar. Intenta de nuevo.</p>}
                </div>
              </form>
            )}
          </div>
        </section>
      );
    }

    case "image": {
      const alignMap: Record<string, string> = { left: "items-start", center: "items-center", right: "items-end" };
      return (
        <section id={c.anchor || undefined} className={`py-12 sm:py-16 px-6 flex flex-col ${alignMap[c.alignment] || "items-center"}`}>
          <div className="max-w-4xl w-full">
            {c.link ? (
              <a href={c.link} target="_blank" rel="noopener noreferrer" className="block">
                <Image src={c.url || "https://placehold.co/800x400/2563EB/white?text=Imagen"} alt={c.alt || ""} width={800} height={400} className="w-full h-auto rounded-2xl hover:opacity-95 transition-opacity" unoptimized />
              </a>
            ) : (
              <Image src={c.url || "https://placehold.co/800x400/2563EB/white?text=Imagen"} alt={c.alt || ""} width={800} height={400} className="w-full h-auto rounded-2xl" unoptimized />
            )}
            {c.caption && <p className="mt-3 text-center text-sm text-slate-500">{c.caption}</p>}
          </div>
        </section>
      );
    }

    case "video": {
      const getEmbedUrl = (url: string) => {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}${c.autoplay ? "?autoplay=1&mute=1" : ""}`;
        const vmMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}${c.autoplay ? "?autoplay=1" : ""}`;
        return url;
      };
      const [a, b] = (c.aspectRatio || "16/9").split("/").map(Number);
      const padding = (b / a) * 100;
      return (
        <section id={c.anchor || undefined} className="py-12 sm:py-16 px-6">
          <div className="max-w-4xl mx-auto">
            {c.title && <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-center mb-8">{c.title}</h2>}
            <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ paddingTop: `${padding}%` }}>
              <iframe
                src={getEmbedUrl(c.url || "")}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={c.title || "Video"}
              />
            </div>
          </div>
        </section>
      );
    }

    
    case "linktree": {
      const { linktree } = c;
      if (!linktree) return null;

      const isDefaultBg = !linktree.background || (linktree.background.type === "none");
      const isLightBg = linktree.background?.type === "color" && linktree.background?.value && !["#000000","#111827","#0f172a","#1e293b","#18181b","#000"].includes(linktree.background.value.toLowerCase()) && (() => { const h = linktree.background.value.replace("#",""); const r = parseInt(h.substring(0,2),16); const g = parseInt(h.substring(2,4),16); const b = parseInt(h.substring(4,6),16); return (r*299+g*587+b*114)/1000 > 150; })();
      const isDark = isDefaultBg || !isLightBg;

      const bgStyle = isDefaultBg
        ? { background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)" }
        : linktree.background?.type === "image"
        ? { backgroundImage: `url(${resolveMediaUrl(linktree.background.value)})`, backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed" as const }
        : linktree.background?.type === "gradient"
        ? { background: linktree.background.value }
        : { backgroundColor: linktree.background?.value || "#0f172a" };

      const socialColors: Record<string, string> = {
        instagram: "#E4405F", facebook: "#1877F2", twitter: "#1DA1F2",
        tiktok: "#000000", youtube: "#FF0000", whatsapp: "#25D366", linkedin: "#0A66C2",
      };

      return (
        <div style={bgStyle} className="min-h-screen w-full flex flex-col items-center py-16 px-4">
          {linktree.background?.type === "image" && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 pointer-events-none" />
          )}
          <div className="w-full max-w-sm mx-auto relative z-10 animate-[fadeUp_.6s_cubic-bezier(.16,1,.3,1)_both]">
            {/* Avatar */}
            <div className="flex flex-col items-center text-center mb-10">
              {linktree.logoUrl ? (
                <div className="w-[112px] h-[112px] rounded-full p-[3px] mb-5 shadow-2xl"
                  style={{ background: isDark ? "linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.1))" : "linear-gradient(135deg,rgba(99,102,241,0.4),rgba(168,85,247,0.4))" }}>
                  <img src={resolveMediaUrl(linktree.logoUrl)} alt={linktree.title}
                    className="w-full h-full rounded-full object-cover border-[3px]"
                    style={{ borderColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff" }} />
                </div>
              ) : (
                <div className="w-[112px] h-[112px] rounded-full mb-5 flex items-center justify-center text-[2.25rem] font-extrabold text-white shadow-2xl border-[3px]"
                  style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", borderColor: isDark ? "rgba(0,0,0,0.3)" : "#ffffff" }}>
                  {linktree.title?.[0]?.toUpperCase()}
                </div>
              )}
              <h1 className={`text-[1.75rem] font-extrabold mb-2 tracking-tight leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {linktree.title}
              </h1>
              {linktree.description && (
                <p className={`text-[.95rem] leading-relaxed max-w-[320px] ${isDark ? 'text-white/70' : 'text-gray-500'}`}>
                  {linktree.description}
                </p>
              )}
            </div>

            {/* Social Icons */}
            {linktree.socials?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {linktree.socials.map((s: any, idx: number) => {
                  const color = socialColors[s.platform] || (isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0");
                  return (
                    <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-xs transition-all duration-300 hover:-translate-y-1 hover:scale-110 shadow-lg"
                      style={{ background: color, boxShadow: `0 4px 14px ${color}44` }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}66`; }}
                      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px ${color}44`; }}>
                      {s.platform?.substring(0, 2)}
                    </a>
                  );
                })}
              </div>
            )}

            {/* Links */}
            {linktree.links?.length > 0 && (
              <div className="flex flex-col gap-3.5">
                {linktree.links.map((link: any, idx: number) => link.isActive !== false && (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`w-full py-4 px-6 rounded-2xl text-center font-semibold text-[.95rem] tracking-wide transition-all duration-300 hover:-translate-y-[3px] hover:scale-[1.02] active:scale-[0.98] shadow-lg backdrop-blur-sm ${
                      isDark
                        ? 'bg-white/10 text-white hover:bg-white/15 border border-white/15 hover:shadow-2xl'
                        : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200/80 hover:shadow-xl'
                    }`}>
                    {link.title}
                  </a>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="mt-14 text-center">
              <a href="https://build.icebergup.com" target="_blank" rel="noopener noreferrer"
                className={`text-[.7rem] font-semibold tracking-[.1em] uppercase transition-colors duration-300 ${
                  isDark ? 'text-white/30 hover:text-white/70' : 'text-gray-300 hover:text-gray-500'
                }`}>
                Powered by Bia
              </a>
            </div>
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
          Bloque: {type}
        </div>
      );
  }
}
