// ARCHIVO GENERADO desde packages/shared/src/templates — no editar aquí.
// Ejecuta `npm run sync:templates -w apps/web` tras cambiar la fuente.

/** Utilidades de medios compartidas por las plantillas (video de YouTube/Vimeo o archivo). */

/** URL de inserción para YouTube / Vimeo (acepta el enlace normal del video). */
export function videoEmbed(url: string): string {
  const u = String(url || "").trim();
  const yt = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i.exec(u);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(u);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return u;
}

/**
 * Video de fondo que cubre todo el contenedor, sin sonido y en bucle:
 * - YouTube / Vimeo: iframe sin controles.
 * - Archivo (.mp4, .webm): <video autoplay muted loop playsinline>.
 * `poster` se muestra mientras carga (o si no hay video).
 */
export function backgroundVideoHtml(url: string, poster = "", style = ""): string {
  const u = String(url || "").trim();
  const posterLayer = poster ? `<div style="position:absolute;inset:0;background:url('${poster}') center/cover no-repeat;${style}"></div>` : "";
  if (!u) return posterLayer;
  const yt = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/i.exec(u);
  const vm = /vimeo\.com\/(?:video\/)?(\d+)/i.exec(u);
  // El iframe se agranda para cubrir el contenedor sin franjas (proporción 16:9).
  const cover = "position:absolute;top:50%;left:50%;width:max(100%,177.78vh);height:max(100%,56.25vw);transform:translate(-50%,-50%);border:0;pointer-events:none";
  if (yt) {
    const id = yt[1];
    return `${posterLayer}<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&modestbranding=1&playsinline=1&rel=0" allow="autoplay; encrypted-media" title="Video de fondo" style="${cover};${style}"></iframe>`;
  }
  if (vm) {
    return `${posterLayer}<iframe src="https://player.vimeo.com/video/${vm[1]}?background=1&autoplay=1&loop=1&muted=1" allow="autoplay" title="Video de fondo" style="${cover};${style}"></iframe>`;
  }
  return `<video autoplay muted loop playsinline ${poster ? `poster="${poster}"` : ""} style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${style}"><source src="${u}"></video>`;
}
