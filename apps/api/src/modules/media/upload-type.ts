import * as sharp from "sharp";

/**
 * Tipo real de un archivo subido, detectado por su contenido (no por el mimetype ni la
 * extensión que manda el cliente, que se pueden falsificar).
 *
 * - "raster": imagen que sharp puede leer (se reprocesa a PNG/JPEG).
 * - "svg":    se convierte a PNG; un SVG puede llevar scripts y, abierto directamente
 *             desde el almacenamiento público, ejecutarlos (XSS).
 * - "pdf":    se guarda tal cual con application/pdf.
 * Todo lo demás (HTML, JS, ejecutables…) se rechaza.
 */
export type UploadKind = "raster" | "svg" | "pdf";

const RASTER_FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "tiff", "heif"]);
export const ALLOWED_UPLOADS_MESSAGE = "Tipo de archivo no permitido. Sube imágenes (JPG, PNG, WebP, GIF, AVIF, SVG) o PDF.";

function looksLikeSvg(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 4096).toString("utf8").replace(/^﻿/, "").trimStart().toLowerCase();
  if (!head.startsWith("<")) return false;
  return /<svg[\s>]/.test(head);
}

export async function detectUploadKind(buffer: Buffer): Promise<UploadKind | null> {
  if (!buffer || buffer.length === 0) return null;
  if (buffer.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (looksLikeSvg(buffer)) return "svg";
  try {
    const meta = await sharp(buffer).metadata();
    if (meta.format === "svg") return "svg";
    if (meta.format && RASTER_FORMATS.has(meta.format)) return "raster";
  } catch {
    /* no es una imagen */
  }
  return null;
}

/** Convierte un SVG a PNG (máx. 1600 px de ancho) sin cargar recursos externos. */
export async function rasterizeSvg(buffer: Buffer): Promise<{ buffer: Buffer; width: number | null; height: number | null }> {
  const image = sharp(buffer, { density: 192, limitInputPixels: 40_000_000 });
  const meta = await image.metadata();
  const out = await image
    .resize({ width: meta.width && meta.width > 1600 ? 1600 : undefined, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: out.data, width: out.info.width || null, height: out.info.height || null };
}
