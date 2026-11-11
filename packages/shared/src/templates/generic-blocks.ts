import { escapeHtmlText } from "./sanitize";

/**
 * HTML de los bloques genéricos (los que no usan una variante de plantilla).
 * Fuente única: lo usa el API para publicar y el editor para dibujar el lienzo,
 * así lo que se ve al editar es lo que se publica.
 *
 * El contenido debe llegar saneado (sanitizeTemplateContent).
 */
export interface GenericBlockContext {
  /** Origen público del API (sin /api/v1), para /uploads y envío de formularios. */
  apiBaseUrl: string;
  site?: any;
  reviews?: any[];
}

export function isLightColor(hex: string): boolean {
  if (!hex || !hex.startsWith("#")) return true;
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

const ICON_CLASS_RE = /^(?:bi|fa|fa-[a-z]+|material-symbols-[a-z]+)(?:[\s-]|$)/i;
const FALLBACK_ICON = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/></svg>`;

function iconHtml(icon: unknown, fallback = FALLBACK_ICON): string {
  const v = typeof icon === "string" ? icon.trim() : "";
  if (!v || ICON_CLASS_RE.test(v)) return fallback;
  return v;
}

/** Devuelve null para tipos que no son genéricos (p. ej. los del blog, que arma el API). */
export function renderGenericBlockHtml(type: string, c: any, ctx: GenericBlockContext): string | null {
  const site = ctx.site;
  const reviews: any[] = ctx.reviews || [];
  const apiBaseUrl = () => (ctx.apiBaseUrl || "").replace(/\/+$/, "");
  const apiV1Url = () => apiBaseUrl() + "/api/v1";
  const absoluteUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("/uploads/")) return `${apiBaseUrl()}${url}`;
    return url;
  };

  switch (type) {
    case "hero": {
      const bgImg = c.backgroundImage ? `<div style="position:absolute;inset:0;background-image:url(${absoluteUrl(c.backgroundImage)});background-size:cover;background-position:center;z-index:0"></div><div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);z-index:1"></div>` : "";
      return `<section style="position:relative;overflow:hidden;text-align:center;padding:clamp(4rem,12vw,8rem) clamp(1rem,5vw,2rem);color:white;min-height:clamp(400px,70vh,600px);display:flex;align-items:center;justify-content:center;${c.backgroundImage ? "" : "background:linear-gradient(135deg,var(--primary),#1e40af)"}">
${bgImg}
${!c.backgroundImage ? `<div style="position:absolute;inset:0;background:radial-gradient(circle at top,rgba(255,255,255,0.12),transparent 60%);z-index:0"></div>` : ""}
<div style="position:relative;z-index:2;max-width:800px;margin:0 auto;padding:0 clamp(1rem,5vw,2rem)">
${c.kicker ? `<p style="display:inline-block;background:rgba(255,255,255,0.15);padding:clamp(4px,1vw,8px) clamp(12px,2vw,20px);border-radius:100px;font-size:clamp(.65rem,1.1vw,.75rem);font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:1.5rem;border:1px solid rgba(255,255,255,0.2)">${c.kicker}</p>` : ""}
<h1 style="font-size:clamp(2rem,6vw,4rem);font-weight:800;margin-bottom:1.25rem;line-height:1.15">${c.title || ""}</h1>
${c.subtitle ? `<p style="font-size:clamp(1rem,2.5vw,1.3rem);opacity:.85;max-width:650px;margin:0 auto 2rem;line-height:1.6">${c.subtitle}</p>` : ""}
<div style="display:flex;flex-wrap:wrap;gap:clamp(.75rem,1.5vw,1rem);justify-content:center">
${c.buttonText ? `<a href="${c.buttonUrl || "#"}" data-analytics-click data-analytics-type="click" data-analytics-label="hero_cta" style="display:inline-block;background:white;color:var(--primary);padding:clamp(12px,2vw,16px) clamp(28px,4vw,40px);border-radius:14px;text-decoration:none;font-weight:600;font-size:clamp(.9rem,1.5vw,1rem);box-shadow:0 4px 16px rgba(0,0,0,.1);transition:transform .2s,box-shadow .2s">${c.buttonText}</a>` : ""}
${c.secondaryButtonText ? `<a href="${c.secondaryButtonUrl || "#"}" data-analytics-click data-analytics-type="click" data-analytics-label="hero_secondary_cta" style="display:inline-block;background:rgba(255,255,255,0.1);color:white;padding:clamp(12px,2vw,16px) clamp(28px,4vw,40px);border-radius:14px;text-decoration:none;font-weight:600;font-size:clamp(.9rem,1.5vw,1rem);border:1px solid rgba(255,255,255,0.25);transition:background .2s">${c.secondaryButtonText}</a>` : ""}
</div>
</div>
</section>`;
    }

    case "services":
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,5vw,3rem);color:#0f172a">${c.title || "Servicios"}</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:clamp(1rem,2vw,1.5rem)">
${(c.items || []).map((item: any) => `<div style="text-align:center;padding:clamp(1.5rem,3vw,2rem);border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;transition:box-shadow .2s">
<h3 style="font-size:clamp(1rem,2vw,1.2rem);font-weight:600;margin-bottom:.75rem;color:#0f172a">${item.title || ""}</h3>
<p style="color:#64748b;line-height:1.6;font-size:clamp(.85rem,1.5vw,.95rem)">${item.desc || ""}</p>
</div>`).join("")}
</div></section>`;

    case "faq":
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:800px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,4vw,2.5rem);color:#0f172a">${c.title || "Preguntas Frecuentes"}</h2>
${(c.items || []).map((item: any) => `<details style="margin-bottom:1rem;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
<summary style="padding:clamp(14px,2vw,20px);cursor:pointer;font-weight:600;color:#0f172a;display:flex;justify-content:space-between;align-items:center;font-size:clamp(.9rem,1.5vw,1rem)">${item.question || ""}<span style="font-size:1.2rem;transition:transform .2s">&#9662;</span></summary>
<p style="padding:0 clamp(14px,2vw,20px) clamp(14px,2vw,20px);color:#64748b;line-height:1.6;font-size:clamp(.85rem,1.5vw,.95rem)">${item.answer || ""}</p>
</details>`).join("")}
</section>`;

    case "cta":
      return `<section style="text-align:center;padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);background:var(--primary);color:white">
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:1rem">${c.title || ""}</h2>
<p style="font-size:clamp(.95rem,2vw,1.15rem);opacity:.9;max-width:650px;margin:0 auto 1.5rem;line-height:1.5">${c.subtitle || ""}</p>
${c.buttonText ? `<a href="${c.buttonUrl || "#"}" data-analytics-click data-analytics-type="click" data-analytics-label="cta_block" style="display:inline-block;background:white;color:var(--primary);padding:clamp(10px,2vw,14px) clamp(24px,4vw,36px);border-radius:10px;text-decoration:none;font-weight:600;font-size:clamp(.9rem,1.5vw,1rem)">${c.buttonText}</a>` : ""}
</section>`;

    case "testimonials": {
      let items = c.items || [];
      if (c.source === "dynamic") {
        items = reviews.map(r => ({
          name: r.authorName,
          quote: r.content,
          role: r.rating ? "★".repeat(r.rating) + "☆".repeat(5 - r.rating) : "",
        }));
      }
      if (items.length === 0) items = [{name: c.emptyTitle || "No hay testimonios", quote: c.emptyText || "Aún no hay reseñas publicadas.", role: ""}];

      const cols = c.columns || 3;
      const isCarousel = c.carousel === true;
      const colsClass = cols === 1 ? "1fr" : cols === 2 ? "repeat(2,1fr)" : "repeat(3,1fr)";

      const cardHtml = (item: any) => `<div style="padding:clamp(1.25rem,2.5vw,1.5rem);border-radius:16px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 1px 2px rgba(0,0,0,.04);display:flex;flex-direction:column;height:100%">
<div style="color:#f59e0b;margin-bottom:.75rem;font-size:1rem">${item.role?.includes('★') ? item.role : '★ ★ ★ ★ ★'}</div>
<p style="font-style:italic;color:#475569;margin-bottom:1rem;line-height:1.6;font-size:clamp(.85rem,1.5vw,.95rem);flex:1">&ldquo;${item.quote || ""}&rdquo;</p>
<div style="display:flex;align-items:center;gap:.75rem;margin-top:auto">
<div style="width:clamp(36px,4vw,44px);height:clamp(36px,4vw,44px);border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:700;color:#475569;font-size:clamp(.75rem,1.3vw,.85rem);flex-shrink:0">${(item.name?.[0] || "?").toUpperCase()}</div>
<div>
<div style="font-weight:600;color:#0f172a;font-size:clamp(.85rem,1.5vw,.95rem)">${item.name || ""}</div>
${!item.role?.includes('★') ? `<div style="color:#94a3b8;font-size:clamp(.75rem,1.2vw,.85rem)">${item.role || ""}</div>` : ''}
</div>
</div>
</div>`;

      if (isCarousel) {
        const slidesPerView = cols;
        const totalSlides = Math.ceil(items.length / slidesPerView);
        const slidesArr: any[][] = [];
        for (let s = 0; s < totalSlides; s++) {
          const chunk = items.slice(s * slidesPerView, s * slidesPerView + slidesPerView);
          slidesArr.push(chunk);
        }
        return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto" class="pub-testimonials" data-slides="${totalSlides}" data-active="0">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,5vw,3rem);color:#0f172a">${c.title || "Testimonios"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-top:-1.5rem;margin-bottom:2rem;font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="position:relative;overflow:hidden">
${slidesArr.map((chunk, si) => `<div class="ts-slide" style="display:grid;grid-template-columns:${colsClass};gap:clamp(1rem,2vw,1.5rem);transition:opacity .4s;${si > 0 ? "opacity:0;position:absolute;inset:0;pointer-events:none" : ""}">${chunk.map(cardHtml).join("")}</div>`).join("")}
</div>
${totalSlides > 1 ? `<div class="pub-testi-dots" style="display:flex;justify-content:center;gap:.5rem;margin-top:1.5rem">${slidesArr.map((_: any, i: number) => `<button class="tdot" data-i="${i}" style="height:8px;border-radius:50px;border:none;cursor:pointer;transition:all .3s;background:${i === 0 ? "#0f172a" : "#e2e8f0"};width:${i === 0 ? "24px" : "8px"}" aria-label="Slide ${i + 1}"></button>`).join("")}</div>` : ""}
</section>`;
      }

      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,5vw,3rem);color:#0f172a">${c.title || "Testimonios"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-top:-1.5rem;margin-bottom:2rem;font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(${cols === 1 ? "100%" : cols === 2 ? "380px" : "280px"},100%),1fr));gap:clamp(1rem,2vw,1.5rem)">
${items.map(cardHtml).join("")}
</div>
</section>`;
    }

    case "review-form": {
      const tenantId = c.tenantId || site?.tenantId;
      const siteId = c.siteId || site?.id;
      const apiUrl = apiBaseUrl();
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:600px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:#0f172a">${c.title || "Déjanos tu opinión"}</h2>
<p style="text-align:center;color:#64748b;margin-bottom:2rem">${c.subtitle || "Valoramos tu experiencia con nosotros"}</p>
<form action="${apiUrl}/api/v1/reviews/public" method="POST" data-pub-form class="pub-form" style="display:flex;flex-direction:column;gap:1.25rem;background:#fff;padding:2rem;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);border:1px solid #e2e8f0">
<input type="hidden" name="tenantId" value="${tenantId}">
<input type="hidden" name="siteId" value="${siteId}">
<input type="text" name="website" value="" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;overflow:hidden" />
<div style="display:flex;flex-direction:column;gap:.5rem;align-items:center;margin-bottom:1rem">
  <label style="font-weight:600;color:#334155;font-size:.95rem">${c.ratingLabel || "Calificación"}</label>
  <div style="display:flex;flex-direction:row-reverse;gap:0.25rem" class="star-rating">
    <input type="radio" id="star5" name="rating" value="5" style="display:none" checked><label for="star5" style="cursor:pointer;font-size:2rem;color:#fbbf24">★</label>
    <input type="radio" id="star4" name="rating" value="4" style="display:none"><label for="star4" style="cursor:pointer;font-size:2rem;color:#cbd5e1">★</label>
    <input type="radio" id="star3" name="rating" value="3" style="display:none"><label for="star3" style="cursor:pointer;font-size:2rem;color:#cbd5e1">★</label>
    <input type="radio" id="star2" name="rating" value="2" style="display:none"><label for="star2" style="cursor:pointer;font-size:2rem;color:#cbd5e1">★</label>
    <input type="radio" id="star1" name="rating" value="1" style="display:none"><label for="star1" style="cursor:pointer;font-size:2rem;color:#cbd5e1">★</label>
  </div>
</div>
<style>
  .star-rating label:hover, .star-rating label:hover ~ label, .star-rating input:checked ~ label { color: #fbbf24 !important; }
</style>
<div style="display:flex;flex-direction:column;gap:.5rem">
  <label style="font-weight:600;color:#334155;font-size:.95rem">${c.nameLabel || "Tu nombre"} <span style="color:#ef4444">*</span></label>
  <input type="text" name="authorName" required style="padding:.75rem;border-radius:8px;border:1px solid #cbd5e1;font-size:1rem;outline:none;transition:border-color .2s">
</div>
<div style="display:flex;flex-direction:column;gap:.5rem">
  <label style="font-weight:600;color:#334155;font-size:.95rem">${c.emailLabel || "Tu correo (Opcional)"}</label>
  <input type="email" name="authorEmail" style="padding:.75rem;border-radius:8px;border:1px solid #cbd5e1;font-size:1rem;outline:none;transition:border-color .2s">
</div>
<div style="display:flex;flex-direction:column;gap:.5rem">
  <label style="font-weight:600;color:#334155;font-size:.95rem">${c.commentLabel || "Comentario"} <span style="color:#ef4444">*</span></label>
  <textarea name="content" required rows="4" style="padding:.75rem;border-radius:8px;border:1px solid #cbd5e1;font-size:1rem;outline:none;transition:border-color .2s;resize:vertical"></textarea>
</div>
<div data-pub-form-status class="form-status" style="display:none;padding:.75rem;border-radius:8px;font-size:.95rem"></div>
<button type="submit" style="background:#0f172a;color:#fff;padding:.875rem 1.5rem;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:background .2s;font-size:1rem;margin-top:.5rem">${c.submitText || "Enviar opinión"}</button>
</form>
</section>`;
    }

    case "sorteo-form": {
      const sorteo = c.sorteo;
      const tenantId = c.tenantId || site?.tenantId;
      const apiUrl = apiBaseUrl();
      const fields = (sorteo?.fields || []) as any[];
      const bg = (sorteo?.background || {}) as any;

      const now = new Date();
      const notStarted = sorteo?.startDate && now < new Date(sorteo.startDate);
      const ended = sorteo?.endDate && now > new Date(sorteo.endDate);
      const available = !!sorteo && !notStarted && !ended;
      const statusMessage = ended ? "Sorteo finalizado" : "El sorteo aún no está disponible";
      const statusSub = ended
        ? "Este sorteo ya ha concluido. ¡Gracias por participar!"
        : sorteo?.startDate
          ? `Este sorteo se abrirá el ${new Date(sorteo.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}. Vuelve pronto.`
          : "Este sorteo aún no está configurado. Vuelve pronto.";

      const fieldHtml = available ? fields.map((f: any) => {
        const req = f.required ? "required" : "";
        const reqStar = f.required ? '<span style="color:#ef4444"> *</span>' : "";
        const label = escapeHtmlText(f.label || f.name);
        if (f.type === "select" && f.options?.length) {
          const opts = f.options.map((o: string) => `<option value="${escapeHtmlText(o)}">${escapeHtmlText(o)}</option>`).join("");
          return `<div style="display:flex;flex-direction:column;gap:.4rem"><label style="font-weight:600;color:#334155;font-size:.9rem">${label}${reqStar}</label><select name="${escapeHtmlText(f.name)}" ${req} style="padding:.7rem;border-radius:8px;border:1px solid #cbd5e1;font-size:.95rem;background:#fff">${opts}</select></div>`;
        }
        if (f.type === "textarea") {
          return `<div style="display:flex;flex-direction:column;gap:.4rem"><label style="font-weight:600;color:#334155;font-size:.9rem">${label}${reqStar}</label><textarea name="${escapeHtmlText(f.name)}" ${req} rows="3" style="padding:.7rem;border-radius:8px;border:1px solid #cbd5e1;font-size:.95rem;resize:vertical"></textarea></div>`;
        }
        const inputType = f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "number" ? "number" : "text";
        return `<div style="display:flex;flex-direction:column;gap:.4rem"><label style="font-weight:600;color:#334155;font-size:.9rem">${label}${reqStar}</label><input type="${inputType}" name="${escapeHtmlText(f.name)}" ${req} style="padding:.7rem;border-radius:8px;border:1px solid #cbd5e1;font-size:.95rem"></div>`;
      }).join("\n") : "";

      const desc = sorteo?.description ? `<p style="text-align:center;color:#64748b;margin-bottom:2rem;max-width:500px;margin-left:auto;margin-right:auto">${escapeHtmlText(sorteo.description)}</p>` : "";
      const endDate = sorteo?.endDate && !ended ? `<p style="text-align:center;color:#94a3b8;font-size:.85rem;margin-bottom:1.5rem">Fecha límite: ${new Date(sorteo.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}</p>` : "";

      let sectionBg = "background:#f8fafc;";
      let titleColor = "#0f172a";
      let formBg = "#fff";
      if (bg.type === "color" && bg.color) {
        sectionBg = `background:${bg.color};`;
        titleColor = isLightColor(bg.color) ? "#0f172a" : "#ffffff";
        formBg = isLightColor(bg.color) ? "#ffffff" : "rgba(255,255,255,0.95)";
      } else if (bg.type === "gradient" && bg.gradientFrom && bg.gradientTo) {
        const angle = bg.gradientAngle || 135;
        sectionBg = `background:linear-gradient(${angle}deg,${bg.gradientFrom},${bg.gradientTo});`;
        titleColor = isLightColor(bg.gradientFrom) ? "#0f172a" : "#ffffff";
        formBg = isLightColor(bg.gradientFrom) ? "#ffffff" : "rgba(255,255,255,0.95)";
      } else if (bg.type === "image" && bg.imageUrl) {
        sectionBg = `background:url('${escapeHtmlText(bg.imageUrl)}') center/cover no-repeat;position:relative;`;
        titleColor = "#ffffff";
        formBg = "rgba(255,255,255,0.95)";
      }
      const imageOverlay = bg.type === "image" ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45);pointer-events:none"></div>` : "";
      const wrapperOpen = bg.type === "image" ? `<div style="position:relative;${sectionBg}min-height:100vh;display:flex;align-items:center;justify-content:center;padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem)">${imageOverlay}<div style="position:relative;z-index:1;width:100%;max-width:600px">` : "";
      const wrapperClose = bg.type === "image" ? `</div></div>` : "";
      const sectionStyle = bg.type === "image" ? "" : `style="${sectionBg}padding:clamp(5rem,12vw,8rem) clamp(1rem,5vw,2rem);width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center"`;
      const formStatus = available
        ? `<form action="${apiUrl}/api/v1/sorteos/public/${tenantId}/${sorteo?.slug}/participate" method="POST" data-pub-form class="pub-form" style="display:flex;flex-direction:column;gap:1.1rem;background:${formBg};padding:2rem;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.12);border:1px solid rgba(255,255,255,0.2)">
${fieldHtml}
<div data-pub-form-status class="form-status" style="display:none;padding:.75rem;border-radius:8px;font-size:.95rem"></div>
<button type="submit" style="background:#0f172a;color:#fff;padding:.875rem 1.5rem;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:background .2s;font-size:1rem;margin-top:.5rem">Participar</button>
</form>`
        : `<div style="display:flex;flex-direction:column;gap:.5rem;background:${formBg};padding:2rem;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.12);border:1px solid rgba(255,255,255,0.2);text-align:center">
<div style="font-size:2.5rem">${ended ? "🎉" : "⏰"}</div>
<h3 style="margin:0;font-size:1.25rem;font-weight:700;color:${titleColor}">${statusMessage}</h3>
<p style="margin:0;color:#64748b;font-size:.95rem;max-width:420px;margin-left:auto;margin-right:auto">${statusSub}</p>
</div>`;

      return `<section ${sectionStyle}>
${wrapperOpen}
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:${titleColor}">${escapeHtmlText(sorteo?.title || "Sorteo")}</h2>
${sorteo?.description ? `<p style="text-align:center;color:${titleColor};opacity:0.8;margin-bottom:2rem;max-width:500px;margin-left:auto;margin-right:auto">${escapeHtmlText(sorteo.description)}</p>` : ""}
${endDate}
${formStatus}
${wrapperClose}
</section>`;
    }

    case "gallery":
      const images = (c.images || []);
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:clamp(2rem,5vw,3rem);color:#0f172a">${c.title || "Galería"}</h2>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(150px,30vw,280px),1fr));gap:clamp(.75rem,1.5vw,1rem)">
${images.map((img: any) => `<img src="${absoluteUrl(img.url || "")}" alt="${img.alt || ""}" style="width:100%;height:clamp(160px,25vw,240px);object-fit:cover;border-radius:12px;transition:opacity .2s" loading="lazy">`).join("")}
</div></section>`;

    case "header": {
      const hLogoType = c.logoType || "text";
      const hHasImage = hLogoType === "image" || hLogoType === "both";
      const hHasText = hLogoType === "text" || hLogoType === "both";
      const variant = c.variant || "classic";
      const logoImg = hHasImage && c.logoImage
        ? `<img src="${absoluteUrl(c.logoImage)}" alt="${c.logoText || "Logo"}" style="height:clamp(28px,4vw,40px);width:auto;max-width:160px;object-fit:contain;flex-shrink:0">`
        : "";
      const logoTextEl = hHasText
        ? `<div style="font-weight:700;font-size:clamp(.95rem,2vw,1.2rem);color:#0f172a;flex-shrink:0">${c.logoText || ""}</div>`
        : "";
      const logoAvatar = !hHasImage && hHasText
        ? `<div style="height:clamp(28px,4vw,36px);width:clamp(28px,4vw,36px);border-radius:10px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:clamp(.7rem,1.3vw,.85rem);color:#475569;flex-shrink:0">${(c.logoText || "A")[0].toUpperCase()}</div>`
        : "";
      const logoEl = hHasImage && !hHasText ? logoImg : `${logoImg}${logoTextEl}${logoAvatar}`;
      const logoRow = `<div style="display:flex;align-items:center;gap:clamp(.5rem,1.5vw,.75rem);flex-shrink:0">${logoEl}</div>`;
      const ctaBtn = c.ctaText ? `<a href="${c.ctaUrl || "#"}" style="display:inline-block;background:#0f172a;color:white;padding:clamp(8px,1.5vw,10px) clamp(14px,2.5vw,20px);border-radius:10px;text-decoration:none;font-weight:600;font-size:clamp(.8rem,1.3vw,.9rem);white-space:nowrap;transition:background .2s;flex-shrink:0">${c.ctaText}</a>` : "";
      const navLinks = (c.links || []).map((link: any) => `<a href="${link.url || "#"}" style="color:#475569;text-decoration:none;font-size:clamp(.85rem,1.4vw,.95rem);transition:color .2s;white-space:nowrap">${link.label || ""}</a>`).join("");

      if (variant === "centered") {
        return `<header class="pub-header" style="position:sticky;top:0;z-index:100;background:white;border-bottom:1px solid #e2e8f0;padding:clamp(12px,2vw,16px) clamp(1rem,5vw,2rem)">
<div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:clamp(.75rem,2vw,1rem)">
<div style="display:flex;align-items:center;justify-content:space-between;width:100%">
${logoRow}
<button class="pub-menu-btn" style="display:none;background:none;border:none;font-size:1.5rem;cursor:pointer;padding:4px 8px;color:#475569" aria-label="Menú">&#9776;</button>
</div>
<nav class="pub-nav" style="display:flex;gap:clamp(1.5rem,3vw,2.5rem);flex-wrap:wrap;justify-content:center;align-items:center">
${navLinks}
${ctaBtn}
</nav>
</div>
</header>`;
      }

      if (variant === "minimal") {
        return `<header class="pub-header" style="position:sticky;top:0;z-index:100;padding:clamp(12px,2vw,16px) clamp(1rem,5vw,2rem)">
<div style="max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:clamp(1rem,2vw,1.5rem)">
${logoRow}
<button class="pub-menu-btn" style="display:none;background:none;border:none;font-size:1.5rem;cursor:pointer;padding:4px 8px;color:#475569" aria-label="Menú">&#9776;</button>
<nav class="pub-nav" style="display:flex;gap:clamp(1.5rem,3vw,2rem);flex-wrap:wrap;align-items:center">
${navLinks}
${ctaBtn}
</nav>
</div>
</header>`;
      }

      // Classic
      return `<header class="pub-header" style="position:sticky;top:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:clamp(12px,2vw,16px) clamp(1rem,5vw,2rem);background:white;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;gap:.5rem">
${logoRow}
<button class="pub-menu-btn" style="display:none;background:none;border:none;font-size:1.5rem;cursor:pointer;padding:4px 8px;color:#475569" aria-label="Menú">&#9776;</button>
<nav class="pub-nav" style="display:flex;gap:clamp(1rem,2vw,1.5rem);flex-wrap:wrap;align-items:center">
${navLinks}
${ctaBtn}
</nav>
</header>`;
    }

    case "footer":
      return `<footer style="padding:clamp(2.5rem,8vw,3.5rem) clamp(1rem,5vw,2rem);background:#1e293b;color:#cbd5e1">
<div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:clamp(1.5rem,3vw,2.5rem)">
<div>
<h3 style="color:white;margin-bottom:1rem;font-size:clamp(1rem,2vw,1.15rem);font-weight:600">${c.companyName || ""}</h3>
<p style="font-size:clamp(.8rem,1.3vw,.9rem);line-height:1.6">${c.description || ""}</p>
</div>
${(c.columns || []).map((col: any) => `<div>
<h4 style="color:white;margin-bottom:.75rem;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:600">${col.title || ""}</h4>
${(col.links || []).map((link: any) => `<div style="margin-bottom:.5rem"><a href="${link.url || "#"}" style="color:#94a3b8;text-decoration:none;font-size:clamp(.78rem,1.2vw,.85rem);transition:color .2s">${link.label || ""}</a></div>`).join("")}
</div>`).join("")}
</div>
<div style="text-align:center;padding-top:clamp(1.5rem,3vw,2rem);margin-top:clamp(1.5rem,3vw,2rem);border-top:1px solid #334155;font-size:clamp(.7rem,1.1vw,.8rem);opacity:.7">${c.copyright || ""} <span style="display:inline-block;margin:0 .5rem">•</span> <a href="/dejar-opinion" data-analytics-click data-analytics-type="click" data-analytics-label="footer_reviews" style="color:#94a3b8;text-decoration:none;transition:color .2s">${c.reviewLinkText || "Dejar una reseña"}</a></div>
</footer>`;

    case "about":
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1100px;margin:0 auto">
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:clamp(2rem,5vw,3rem);align-items:center">
<div>
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a;margin-bottom:1rem">${c.title || ""}</h2>
<p style="color:#475569;line-height:1.7;font-size:clamp(.9rem,1.5vw,1rem)">${c.description || ""}</p>
${c.buttonText ? `<a href="${c.buttonUrl || "#"}" data-analytics-click data-analytics-type="click" data-analytics-label="about_cta" style="display:inline-block;margin-top:1.5rem;background:var(--primary);color:white;padding:clamp(10px,2vw,14px) clamp(24px,4vw,32px);border-radius:10px;text-decoration:none;font-weight:600;font-size:clamp(.85rem,1.4vw,.95rem)">${c.buttonText}</a>` : ""}
</div>
${c.imageUrl ? `<div><img src="${absoluteUrl(c.imageUrl)}" alt="${c.title || ""}" style="width:100%;height:auto;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)" loading="lazy"></div>` : ""}
</div>
</section>`;

    case "contact": {
      const formFields = (c.fields || [{ label: "Nombre", type: "text", name: "name" }, { label: "Email", type: "email", name: "email" }, { label: "Mensaje", type: "textarea", name: "message" }]) as any[];
      const actionUrl = site?.tenantId ? `${apiV1Url()}/leads/submit/${site.tenantId}` : "#";
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);background:#f8fafc">
<div style="max-width:700px;margin:0 auto">
<div style="text-align:center;margin-bottom:clamp(2rem,4vw,2.5rem)">
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a;margin-bottom:.5rem">${c.title || "Contacto"}</h2>
${c.subtitle ? `<p style="color:#64748b;font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
</div>
<form method="POST" action="${actionUrl}" data-pub-form style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:clamp(1.5rem,3vw,2rem);box-shadow:0 1px 3px rgba(0,0,0,.04)">
<input type="hidden" name="siteId" value="${site?.id || ""}">
<div style="display:flex;flex-direction:column;gap:1rem">
${formFields.map((f: any) => {
if (f.type === "textarea") {
  return `<div><label style="display:block;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:500;color:#334155;margin-bottom:.4rem">${f.label || f.name}${f.required ? ' <span style="color:#ef4444">*</span>' : ""}</label><textarea name="${f.name || "message"}" ${f.required ? "required" : ""} rows="4" style="width:100%;padding:clamp(10px,2vw,14px);border:1px solid #e2e8f0;border-radius:10px;font-size:clamp(.85rem,1.4vw,.95rem);font-family:inherit;resize:vertical;box-sizing:border-box"></textarea></div>`;
}
return `<div><label style="display:block;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:500;color:#334155;margin-bottom:.4rem">${f.label || f.name}${f.required ? ' <span style="color:#ef4444">*</span>' : ""}</label><input type="${f.type || "text"}" name="${f.name || "field"}" ${f.required ? "required" : ""} style="width:100%;padding:clamp(10px,2vw,14px);border:1px solid #e2e8f0;border-radius:10px;font-size:clamp(.85rem,1.4vw,.95rem);font-family:inherit;box-sizing:border-box"></div>`;
}).join("")}
<div data-pub-form-status style="display:none;padding:12px 16px;border-radius:10px;font-size:clamp(.85rem,1.3vw,.9rem);text-align:center;font-weight:600"></div>
<button type="submit" style="width:100%;padding:clamp(10px,2vw,14px);background:var(--primary);color:white;border:none;border-radius:12px;font-weight:600;font-size:clamp(.85rem,1.4vw,.95rem);cursor:pointer;transition:background .2s">${c.buttonText || "Enviar"}</button>
</div>
</form>
</div>
</section>`;
    }

    case "whatsapp":
      return `<a href="https://wa.me/${c.phone || "521234567890"}?text=${encodeURIComponent(c.message || "Hola")}" target="_blank" rel="noopener" data-analytics-click data-analytics-type="whatsapp_click" data-analytics-label="whatsapp_block" style="position:fixed;z-index:9999;${c.position === "bottom-left" ? "left:1.5rem" : "right:1.5rem"};bottom:1.5rem;width:${c.size || 56}px;height:${c.size || 56}px;background:${c.color || "#25D366"};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.4);transition:transform .2s,box-shadow .2s;text-decoration:none" title="${c.tooltip || "Chatea con nosotros"}">
<svg width="${Math.floor((c.size || 56) * 0.5)}" height="${Math.floor((c.size || 56) * 0.5)}" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
</a>`;

    case "pricing":
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);background:#f8fafc">
<div style="max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:#0f172a">${c.title || "Nuestros planes"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-bottom:clamp(2rem,5vw,3rem);font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:clamp(1rem,2vw,1.5rem);align-items:start">
${(c.plans || []).map((plan: any) => {
const features = typeof plan.features === "string" ? plan.features.split(",").map((s: string) => s.trim()).filter(Boolean) : (plan.features || []);
const highlighted = plan.highlighted === "true" || plan.highlighted === true;
return `<div style="border-radius:16px;padding:clamp(1.5rem,3vw,2.5rem);border:2px solid ${highlighted ? "#0f172a" : "#e2e8f0"};background:white;position:relative;${highlighted ? "transform:scale(1.02);box-shadow:0 8px 30px rgba(0,0,0,.08)" : "box-shadow:0 1px 3px rgba(0,0,0,.04)"}">
${highlighted ? `<span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#0f172a;color:white;font-size:.7rem;font-weight:700;padding:4px 16px;border-radius:100px">Popular</span>` : ""}
<h3 style="font-size:clamp(1rem,2vw,1.2rem);font-weight:700;color:#0f172a;margin-bottom:.5rem">${plan.name || "Plan"}</h3>
<div style="font-size:clamp(2rem,5vw,3rem);font-weight:800;color:#0f172a;margin-bottom:.25rem">${plan.price || "$0"}</div>
${plan.description ? `<p style="color:#64748b;font-size:clamp(.8rem,1.3vw,.9rem);margin-bottom:1.5rem">${plan.description}</p>` : ""}
<ul style="list-style:none;padding:0;margin:0 0 1.5rem 0;display:flex;flex-direction:column;gap:.75rem">
${features.map((f: string) => `<li style="display:flex;gap:.5rem;font-size:clamp(.8rem,1.3vw,.9rem);color:#334155;line-height:1.4"><span style="color:#22c55e;flex-shrink:0;font-weight:700">✓</span> ${f}</li>`).join("")}
</ul>
${plan.buttonText ? `<a href="${plan.buttonUrl || "#"}" style="display:block;text-align:center;padding:clamp(10px,2vw,14px);border-radius:12px;font-weight:600;font-size:clamp(.85rem,1.3vw,.95rem);text-decoration:none;transition:background .2s;${highlighted ? "background:#0f172a;color:white" : "background:#f1f5f9;color:#0f172a"}">${plan.buttonText}</a>` : ""}
</div>`;
}).join("")}
</div>
</div>
</section>`;

    case "team":
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:#0f172a">${c.title || "Nuestro equipo"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-bottom:clamp(2rem,5vw,3rem);font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:clamp(1.5rem,3vw,2.5rem);text-align:center">
${(c.members || []).map((m: any) => `<div>
<div style="width:clamp(100px,20vw,140px);height:clamp(100px,20vw,140px);border-radius:16px;overflow:hidden;background:#f1f5f9;margin:0 auto;border:2px solid #e2e8f0;transition:border-color .2s">
${m.image ? `<img src="${m.image}" alt="${m.name || ""}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:clamp(1.5rem,4vw,2.5rem);font-weight:700;color:#94a3b8">${(m.name?.[0] || "?").toUpperCase()}</div>`}
</div>
<h3 style="margin-top:1rem;font-weight:700;font-size:clamp(.9rem,1.5vw,1.05rem);color:#0f172a">${m.name || ""}</h3>
<p style="font-size:clamp(.75rem,1.2vw,.85rem);color:#64748b;margin-top:.25rem">${m.role || ""}</p>
${m.bio ? `<p style="font-size:clamp(.75rem,1.2vw,.85rem);color:#94a3b8;margin-top:.5rem;line-height:1.5">${m.bio}</p>` : ""}
</div>`).join("")}
</div>
</section>`;

    case "features":
    case "benefits":
    case "process":
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
${c.kicker ? `<p style="text-align:center;color:var(--primary);font-weight:700;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:.5rem">${c.kicker}</p>` : ""}
<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-bottom:.5rem;color:#0f172a">${c.title || "¿Por qué elegirnos?"}</h2>
${c.subtitle ? `<p style="text-align:center;color:#64748b;margin-bottom:clamp(2rem,5vw,3rem);font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:clamp(1rem,2vw,1.5rem)">
${(c.items || []).map((item: any, i: number) => `<div style="padding:clamp(1.25rem,2.5vw,2rem);border-radius:16px;background:#fff;border:1px solid #e2e8f0;transition:box-shadow .2s,border-color .2s">
<div style="font-size:clamp(1.5rem,3vw,2rem);margin-bottom:.75rem;color:var(--primary)">${type === "process" ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border-radius:999px;background:var(--primary);color:#fff;font-size:1rem;font-weight:700">${i + 1}</span>` : iconHtml(item.icon, "✨")}</div>
<h3 style="font-weight:600;color:#0f172a;margin-bottom:.5rem;font-size:clamp(.95rem,1.5vw,1.05rem)">${item.title || ""}</h3>
<p style="color:#64748b;font-size:clamp(.8rem,1.3vw,.9rem);line-height:1.6">${item.desc || ""}</p>
</div>`).join("")}
</div>
</section>`;

    case "form": {
      const formFields = (c.fields || []) as any[];
      const actionUrl = site?.tenantId ? `${apiV1Url()}/leads/submit/${site.tenantId}` : "#";
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);background:#f8fafc">
<div style="max-width:700px;margin:0 auto">
<div style="text-align:center;margin-bottom:clamp(2rem,4vw,2.5rem)">
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a;margin-bottom:.5rem">${c.title || "Contáctanos"}</h2>
${c.subtitle ? `<p style="color:#64748b;font-size:clamp(.9rem,1.5vw,1rem)">${c.subtitle}</p>` : ""}
</div>
<form method="POST" action="${actionUrl}" data-pub-form style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:clamp(1.5rem,3vw,2rem);box-shadow:0 1px 3px rgba(0,0,0,.04)">
<input type="hidden" name="siteId" value="${site?.id || ""}">
<div style="display:flex;flex-direction:column;gap:1rem">
${formFields.map((f: any) => {
if (f.type === "textarea") {
  return `<div><label style="display:block;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:500;color:#334155;margin-bottom:.4rem">${f.label || f.name}${f.required ? ' <span style="color:#ef4444">*</span>' : ""}</label><textarea name="${f.name || "message"}" ${f.required ? "required" : ""} rows="4" style="width:100%;padding:clamp(10px,2vw,14px);border:1px solid #e2e8f0;border-radius:10px;font-size:clamp(.85rem,1.4vw,.95rem);font-family:inherit;resize:vertical;box-sizing:border-box"></textarea></div>`;
}
return `<div><label style="display:block;font-size:clamp(.8rem,1.3vw,.9rem);font-weight:500;color:#334155;margin-bottom:.4rem">${f.label || f.name}${f.required ? ' <span style="color:#ef4444">*</span>' : ""}</label><input type="${f.type || "text"}" name="${f.name || "field"}" ${f.required ? "required" : ""} style="width:100%;padding:clamp(10px,2vw,14px);border:1px solid #e2e8f0;border-radius:10px;font-size:clamp(.85rem,1.4vw,.95rem);font-family:inherit;box-sizing:border-box"></div>`;
}).join("")}
<div data-pub-form-status style="display:none;padding:12px 16px;border-radius:10px;font-size:clamp(.85rem,1.3vw,.9rem);text-align:center;font-weight:600"></div>
<button type="submit" style="width:100%;padding:clamp(10px,2vw,14px);background:#0f172a;color:white;border:none;border-radius:12px;font-weight:600;font-size:clamp(.85rem,1.4vw,.95rem);cursor:pointer;transition:background .2s">${c.buttonText || "Enviar"}</button>
</div>
</form>
</div>
</section>`;
    }

    case "image":
      const align = c.alignment || "center";
      const imgHtml = `<img src="${absoluteUrl(c.url || "")}" alt="${c.alt || ""}" style="width:100%;height:auto;border-radius:16px;display:block;${align === "center" ? "margin:0 auto" : align === "right" ? "margin-left:auto" : ""}" loading="lazy">`;
      const imgEl = c.link ? `<a href="${c.link}" target="_blank" rel="noopener" style="display:block;transition:opacity .2s">${imgHtml}</a>` : imgHtml;
      return `<section style="padding:clamp(2rem,6vw,4rem) clamp(1rem,5vw,2rem);max-width:1100px;margin:0 auto">
${imgEl}
${c.caption ? `<p style="text-align:center;margin-top:.75rem;font-size:clamp(.8rem,1.3vw,.9rem);color:#64748b">${c.caption}</p>` : ""}
</section>`;

    case "video": {
      const getEmbedUrl = (url: string) => {
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}${c.autoplay ? "?autoplay=1&mute=1" : ""}`;
        const vmMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}${c.autoplay ? "?autoplay=1" : ""}`;
        return url;
      };
      const [a, b] = (c.aspectRatio || "16/9").split("/").map((x: string) => Number(x));
      const pad = (b / a) * 100;
      return `<section style="padding:clamp(2rem,6vw,4rem) clamp(1rem,5vw,2rem);max-width:1100px;margin:0 auto">
${c.title ? `<h2 style="text-align:center;font-size:clamp(1.5rem,4vw,2rem);font-weight:800;color:#0f172a;margin-bottom:clamp(1.5rem,3vw,2rem)">${c.title}</h2>` : ""}
<div style="position:relative;padding-top:${pad}%;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
<iframe src="${getEmbedUrl(c.url || "")}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="${c.title || "Video"}"></iframe>
</div>
</section>`;
    }

    case "linktree": {
      const lt = c.linktree;
      if (!lt) return "";
      const bg = lt.background;
      let sectionBg = "background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%)";
      let titleColor = "#ffffff";
      let descColor = "rgba(255,255,255,0.7)";
      let linkBg = "rgba(255,255,255,0.1)";
      let linkBorder = "1px solid rgba(255,255,255,0.15)";
      let linkText = "#ffffff";
      let socialBg = "rgba(255,255,255,0.12)";
      let socialText = "#ffffff";
      let isDark = true;
      let cardShadow = "0 8px 32px rgba(0,0,0,0.3)";
      if (bg?.type === "color" && bg.value) {
        sectionBg = `background:${bg.value}`;
        isDark = !isLightColor(bg.value);
      } else if (bg?.type === "gradient" && bg.value) {
        sectionBg = `background:${bg.value}`;
        isDark = !isLightColor(bg.gradientFrom || "#ffffff");
      } else if (bg?.type === "image" && bg.value) {
        sectionBg = `background:url('${escapeHtmlText(bg.value)}') center/cover no-repeat fixed`;
        isDark = true;
      }
      if (!isDark) {
        titleColor = "#0f172a"; descColor = "#64748b";
        linkBg = "#ffffff"; linkText = "#0f172a"; linkBorder = "1px solid #e2e8f0";
        socialBg = "#f1f5f9"; socialText = "#334155";
        cardShadow = "0 4px 20px rgba(0,0,0,0.08)";
      }
      const imageOverlay = bg?.type === "image" ? `<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.6) 0%,rgba(0,0,0,0.4) 100%)"></div>` : "";
      const relativeOpen = bg?.type === "image" ? `<div style="position:relative">` : "";
      const relativeClose = bg?.type === "image" ? `</div>` : "";
      const logoShadow = isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.12)";

      const logoHtml = lt.logoUrl
        ? `<img src="${escapeHtmlText(absoluteUrl(lt.logoUrl))}" alt="${escapeHtmlText(lt.title)}" style="max-height:100px;width:auto;max-width:200px;object-fit:contain;margin-bottom:1.5rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.15))">`
        : `<div style="width:112px;height:112px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;display:flex;align-items:center;justify-content:center;font-size:2.25rem;font-weight:800;margin-bottom:1.25rem;box-shadow:${logoShadow};border:3px solid ${isDark ? "rgba(0,0,0,0.3)" : "#ffffff"};letter-spacing:-0.02em">${escapeHtmlText((lt.title || "?")[0]?.toUpperCase() || "?")}</div>`;

      const socialIcons: Record<string, string> = {
        instagram: "#E4405F", facebook: "#1877F2", twitter: "#1DA1F2",
        tiktok: "#000000", youtube: "#FF0000", whatsapp: "#25D366", linkedin: "#0A66C2",
      };
      const socialSvg: Record<string, string> = {
        instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
        facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
        twitter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        tiktok: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 3.76.93V6.69z"/></svg>',
        youtube: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
        whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
        linkedin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
      };
      const socialsHtml = (lt.socials || []).map((s: any) => {
        const color = socialIcons[s.platform] || (isDark ? "rgba(255,255,255,0.2)" : "#e2e8f0");
        const svg = socialSvg[s.platform] || `<span style="font-weight:700;font-size:.75rem;text-transform:capitalize">${escapeHtmlText((s.platform || "").substring(0, 2))}</span>`;
        return `<a href="${escapeHtmlText(s.url || "#")}" target="_blank" rel="noopener noreferrer" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:all .3s cubic-bezier(.4,0,.2,1);text-decoration:none;background:${color};color:#fff;box-shadow:0 4px 14px ${color}44" onmouseover="this.style.transform='translateY(-3px) scale(1.1)';this.style.boxShadow='0 8px 20px ${color}66'" onmouseout="this.style.transform='translateY(0) scale(1)';this.style.boxShadow='0 4px 14px ${color}44'">${svg}</a>`;
      }).join("\n");

      const linksHtml = (lt.links || []).filter((l: any) => l.isActive !== false).map((l: any, i: number) =>
        `<a href="${escapeHtmlText(l.url || "#")}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center;width:100%;padding:1rem 1.5rem;border-radius:16px;text-align:center;font-weight:600;font-size:.95rem;letter-spacing:.01em;text-decoration:none;transition:all .3s cubic-bezier(.4,0,.2,1);box-shadow:${cardShadow};background:${linkBg};color:${linkText};border:${linkBorder};backdrop-filter:blur(10px)" onmouseover="this.style.transform='translateY(-3px) scale(1.02)';this.style.boxShadow='0 12px 40px rgba(0,0,0,0.25)'" onmouseout="this.style.transform='translateY(0) scale(1)';this.style.boxShadow='${cardShadow}'">${escapeHtmlText(l.title || "")}</a>`
      ).join("\n");

      return `<style>.linktree-fade{animation:linktreeIn .6s cubic-bezier(.16,1,.3,1) both}@keyframes linktreeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}</style>
<section style="${sectionBg};min-height:100vh;width:100%;display:flex;flex-direction:column;align-items:center;padding:clamp(4rem,12vw,6rem) clamp(1rem,5vw,2rem)">
${imageOverlay}
${relativeOpen}
<div style="width:100%;max-width:24rem;margin:0 auto;position:relative;z-index:1" class="linktree-fade">
<div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:2.5rem">
${logoHtml}
<h1 style="font-size:1.75rem;font-weight:800;margin-bottom:.5rem;color:${titleColor};letter-spacing:-.02em;line-height:1.2">${escapeHtmlText(lt.title || "")}</h1>
${lt.description ? `<p style="font-size:.95rem;color:${descColor};line-height:1.5;max-width:320px;margin:0 auto">${escapeHtmlText(lt.description)}</p>` : ""}
</div>
${socialsHtml ? `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;margin-bottom:2.5rem">${socialsHtml}</div>` : ""}
${linksHtml ? `<div style="display:flex;flex-direction:column;gap:.875rem">${linksHtml}</div>` : ""}
<div style="margin-top:3.5rem;text-align:center">
<a href="https://icebergup.com" target="_blank" rel="noopener noreferrer" style="font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;color:${isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)"};transition:color .3s" onmouseover="this.style.color='${isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)"}'" onmouseout="this.style.color='${isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)"}'">Hecho por Iceberg Agency</a>
</div>
</div>
${relativeClose}
</section>`;
    }

    case "stats":
      return `<section${c.anchor ? ` id="${c.anchor}"` : ""} style="padding:clamp(3rem,8vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
${c.title || c.subtitle ? `<div style="text-align:center;max-width:640px;margin:0 auto clamp(2rem,5vw,2.5rem)">
${c.title ? `<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a">${c.title}</h2>` : ""}
${c.subtitle ? `<p style="margin-top:.75rem;color:#64748b">${c.subtitle}</p>` : ""}
</div>` : ""}
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:1rem">
${(c.items || []).map((it: any) => `<div style="border-radius:16px;background:#fff;border:1px solid #e2e8f0;padding:1.25rem;box-shadow:0 1px 2px rgba(15,23,42,.04)">
<div style="font-size:clamp(1.75rem,4vw,2.25rem);font-weight:800;letter-spacing:-.02em;color:var(--primary)">${it.value ?? ""}${it.suffix || ""}</div>
<div style="margin-top:.5rem;font-size:.9rem;font-weight:600;color:#0f172a">${it.label || ""}</div>
${it.desc ? `<div style="margin-top:.25rem;font-size:.85rem;color:#64748b;line-height:1.6">${it.desc}</div>` : ""}
</div>`).join("")}
</div>
</section>`;

    case "portfolio":
      return `<section id="${c.anchor || "portfolio"}" style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:1200px;margin:0 auto">
<div style="max-width:640px;margin-bottom:clamp(2rem,5vw,2.5rem)">
${c.kicker ? `<p style="color:var(--primary);font-weight:700;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:.5rem">${c.kicker}</p>` : ""}
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a">${c.title || "Portafolio"}</h2>
${c.subtitle ? `<p style="margin-top:.75rem;color:#64748b">${c.subtitle}</p>` : ""}
</div>
<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:1.5rem">
${(c.items || []).map((p: any) => {
        const tag = p.category || p.tag || "";
        return `<a href="${p.link || "#"}" style="display:block;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;background:#fff;text-decoration:none;color:inherit">
<div style="position:relative;aspect-ratio:4/3;background:#f1f5f9">
<img src="${absoluteUrl(p.image) || "https://placehold.co/1200x800/111827/FFFFFF?text=Proyecto"}" alt="${p.title || ""}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" loading="lazy">
<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.45),rgba(0,0,0,.1),transparent)"></div>
<div style="position:absolute;left:1rem;right:1rem;bottom:1rem">
${tag ? `<span style="display:inline-block;border-radius:999px;background:rgba(255,255,255,.9);color:#1e293b;padding:.15rem .6rem;font-size:.65rem;font-weight:800;letter-spacing:.04em">${tag}</span>` : ""}
<div style="margin-top:.5rem;color:#fff;font-weight:600;font-size:1.1rem;line-height:1.25">${p.title || ""}</div>
</div>
</div>
${p.desc ? `<div style="padding:1.25rem"><p style="font-size:.9rem;color:#64748b;line-height:1.6">${p.desc}</p></div>` : ""}
</a>`;
      }).join("")}
</div>
</section>`;

    case "timeline": {
      const eyebrow = c.timelineEyebrow || c.eyebrow || "";
      const line1 = c.timelineTitleLine1 || c.titleLine1 || c.title || "";
      const highlight = c.timelineHighlight || c.titleHighlight || "";
      return `<section style="padding:clamp(3rem,10vw,5rem) clamp(1rem,5vw,2rem);max-width:900px;margin:0 auto">
<div style="text-align:center;margin-bottom:clamp(2rem,5vw,3rem)">
${eyebrow ? `<p style="color:var(--primary);font-weight:700;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:.5rem">${eyebrow}</p>` : ""}
<h2 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;color:#0f172a">${line1}${highlight ? ` <span style="color:var(--primary)">${highlight}</span>` : ""}</h2>
</div>
<ol style="list-style:none;position:relative;border-left:2px solid #e2e8f0;margin-left:.75rem;padding-left:1.75rem;display:flex;flex-direction:column;gap:2rem">
${(c.items || []).map((it: any) => `<li style="position:relative">
<span style="position:absolute;left:-2.35rem;top:.2rem;width:1.1rem;height:1.1rem;border-radius:999px;background:#fff;border:3px solid var(--primary)"></span>
${it.year ? `<div style="font-weight:800;color:var(--primary);font-size:.9rem">${it.year}</div>` : ""}
<h3 style="font-weight:700;color:#0f172a;margin-top:.15rem">${it.title || ""}</h3>
${it.desc ? `<p style="margin-top:.35rem;color:#64748b;font-size:.92rem;line-height:1.6">${it.desc}</p>` : ""}
</li>`).join("")}
</ol>
</section>`;
    }

    case "clients": {
      const logos = (Array.isArray(c.items) && c.items.length ? c.items : c.clients) || [];
      const title = c.title || c.clientsTitle || "";
      return `<section style="padding:clamp(2.5rem,8vw,4rem) clamp(1rem,5vw,2rem);max-width:1100px;margin:0 auto;text-align:center">
${title ? `<h2 style="font-size:clamp(1.25rem,3vw,1.75rem);font-weight:800;color:#0f172a;margin-bottom:clamp(1.5rem,4vw,2rem)">${title}</h2>` : ""}
<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:clamp(1.5rem,4vw,3rem)">
${logos.map((l: any) => `<img src="${absoluteUrl(l.image)}" alt="${l.alt || ""}" style="height:clamp(36px,6vw,56px);width:auto;object-fit:contain;filter:grayscale(1);opacity:.75" loading="lazy">`).join("")}
</div>
</section>`;
    }

    case "blog-list":
    case "blog-article":
      return null;

    default:
      return `<div style="padding:clamp(2rem,5vw,3rem) clamp(1rem,4vw,2rem);text-align:center;color:#94a3b8"><p>Bloque: ${type}</p></div>`;
  }
}

/** CSS base que la página publicada aplica a los bloques genéricos (variables y header móvil). */
export function genericPageBaseCss(colors: { primary: string; secondary: string; accent: string }, paletteVars = ""): string {
  return `:root{--primary:${colors.primary};--secondary:${colors.secondary};--accent:${colors.accent};${paletteVars}}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1e293b;background:#fff;-webkit-font-smoothing:antialiased}
img{max-width:100%;height:auto;display:block}
a{color:inherit}
@media(max-width:768px){
  .pub-nav{display:none!important;width:100%;flex-direction:column;padding-top:1rem;gap:.5rem!important}
  .pub-menu-btn{display:block!important}
  .pub-header.open .pub-nav{display:flex!important}
}
.pub-header{transition:box-shadow .2s}
.pub-header:hover{box-shadow:0 1px 8px rgba(0,0,0,.06)}`;
}
