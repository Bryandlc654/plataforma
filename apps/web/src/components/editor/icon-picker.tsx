"use client";

import { useState } from "react";

/** Selector de íconos (Font Awesome o Bootstrap Icons) para los campos de ícono de las plantillas. */
const FA_ICONS = [
  { value: "fa-solid fa-bullhorn", label: "Megáfono" },
  { value: "fa-solid fa-fire", label: "Fuego" },
  { value: "fa-solid fa-bolt", label: "Rayo" },
  { value: "fa-solid fa-rocket", label: "Cohete" },
  { value: "fa-solid fa-chart-line", label: "Gráfico de línea" },
  { value: "fa-solid fa-chart-pie", label: "Gráfico de pastel" },
  { value: "fa-solid fa-arrow-trend-up", label: "Tendencia al alza" },
  { value: "fa-solid fa-comments", label: "Comentarios" },
  { value: "fa-solid fa-thumbs-up", label: "Me gusta" },
  { value: "fa-solid fa-heart", label: "Corazón" },
  { value: "fa-solid fa-star", label: "Estrella" },
  { value: "fa-solid fa-trophy", label: "Trofeo" },
  { value: "fa-solid fa-award", label: "Premio" },
  { value: "fa-solid fa-graduation-cap", label: "Graduación" },
  { value: "fa-solid fa-book-open", label: "Libro" },
  { value: "fa-solid fa-laptop-code", label: "Laptop con código" },
  { value: "fa-solid fa-code", label: "Código" },
  { value: "fa-solid fa-mobile-screen", label: "Móvil" },
  { value: "fa-solid fa-globe", label: "Globo" },
  { value: "fa-solid fa-bullseye", label: "Diana" },
  { value: "fa-solid fa-crosshairs", label: "Precisión" },
  { value: "fa-solid fa-pen-nib", label: "Pluma" },
  { value: "fa-solid fa-palette", label: "Paleta" },
  { value: "fa-solid fa-camera", label: "Cámara" },
  { value: "fa-solid fa-video", label: "Video" },
  { value: "fa-solid fa-clapperboard", label: "Claqueta" },
  { value: "fa-solid fa-wand-magic-sparkles", label: "Varita mágica" },
  { value: "fa-solid fa-user-plus", label: "Agregar usuario" },
  { value: "fa-solid fa-users", label: "Usuarios" },
  { value: "fa-solid fa-users-gear", label: "Usuarios con engranaje" },
  { value: "fa-solid fa-handshake", label: "Apretón de manos" },
  { value: "fa-solid fa-phone", label: "Teléfono" },
  { value: "fa-solid fa-envelope", label: "Sobre" },
  { value: "fa-solid fa-cart-shopping", label: "Carrito" },
  { value: "fa-solid fa-bag-shopping", label: "Bolsa de compras" },
  { value: "fa-solid fa-credit-card", label: "Tarjeta de crédito" },
  { value: "fa-solid fa-money-bill-trend-up", label: "Dinero y crecimiento" },
  { value: "fa-solid fa-coins", label: "Monedas" },
  { value: "fa-solid fa-circle-check", label: "Check en círculo" },
  { value: "fa-solid fa-check", label: "Check" },
  { value: "fa-solid fa-lightbulb", label: "Bombilla" },
  { value: "fa-solid fa-magnifying-glass", label: "Lupa" },
  { value: "fa-solid fa-gear", label: "Engranaje" },
  { value: "fa-solid fa-shield-halved", label: "Escudo" },
  { value: "fa-solid fa-lock", label: "Candado" },
  { value: "fa-solid fa-calendar-check", label: "Calendario con check" },
  { value: "fa-solid fa-clock", label: "Reloj" },
  { value: "fa-solid fa-paper-plane", label: "Avión de papel" },
  { value: "fa-solid fa-sliders", label: "Controles / ajustes" },
  { value: "fa-solid fa-spinner", label: "Carga / dinámico" },
  { value: "fa-solid fa-download", label: "Descarga" },
  { value: "fa-solid fa-receipt", label: "Recibo / factura" },
];

const FA_BRAND_ICONS = [
  { value: "fa-brands fa-facebook-f", label: "Facebook" },
  { value: "fa-brands fa-instagram", label: "Instagram" },
  { value: "fa-brands fa-whatsapp", label: "WhatsApp" },
  { value: "fa-brands fa-tiktok", label: "TikTok" },
  { value: "fa-brands fa-x-twitter", label: "X (Twitter)" },
  { value: "fa-brands fa-youtube", label: "YouTube" },
  { value: "fa-brands fa-linkedin-in", label: "LinkedIn" },
  { value: "fa-brands fa-telegram", label: "Telegram" },
  { value: "fa-brands fa-discord", label: "Discord" },
  { value: "fa-brands fa-github", label: "GitHub" },
  { value: "fa-brands fa-spotify", label: "Spotify" },
  { value: "fa-brands fa-google", label: "Google" },
];

const BI_ICONS = [
  { value: "bi-arrow-repeat", label: "Reciclaje / repetir" },
  { value: "bi-arrow-right", label: "Flecha derecha" },
  { value: "bi-arrow-up-right", label: "Flecha diagonal" },
  { value: "bi-award", label: "Premio" },
  { value: "bi-box-seam", label: "Caja / paquete" },
  { value: "bi-building", label: "Edificio" },
  { value: "bi-calendar-check", label: "Calendario" },
  { value: "bi-check-lg", label: "Check" },
  { value: "bi-check2-circle", label: "Check en círculo" },
  { value: "bi-clock", label: "Reloj" },
  { value: "bi-crosshair", label: "Precisión / diana" },
  { value: "bi-cup-straw", label: "Sorbete / bebida" },
  { value: "bi-envelope", label: "Sobre" },
  { value: "bi-flag", label: "Bandera" },
  { value: "bi-flower1", label: "Flor" },
  { value: "bi-gear", label: "Engranaje" },
  { value: "bi-geo-alt", label: "Ubicación" },
  { value: "bi-geo-alt-fill", label: "Ubicación rellena" },
  { value: "bi-globe-americas", label: "Globo América" },
  { value: "bi-heart", label: "Corazón" },
  { value: "bi-house", label: "Casa" },
  { value: "bi-lightbulb", label: "Bombilla" },
  { value: "bi-map", label: "Mapa" },
  { value: "bi-patch-check", label: "Certificado" },
  { value: "bi-pencil", label: "Lápiz" },
  { value: "bi-people", label: "Personas" },
  { value: "bi-person", label: "Persona" },
  { value: "bi-play-circle", label: "Reproducir" },
  { value: "bi-quote", label: "Comillas" },
  { value: "bi-rocket-takeoff", label: "Cohete" },
  { value: "bi-send", label: "Enviar" },
  { value: "bi-shield-check", label: "Escudo verificado" },
  { value: "bi-speedometer2", label: "Velocímetro" },
  { value: "bi-star", label: "Estrella" },
  { value: "bi-star-fill", label: "Estrella rellena" },
  { value: "bi-sun", label: "Sol" },
  { value: "bi-telephone", label: "Teléfono" },
  { value: "bi-box-arrow-up-right", label: "Enlace externo" },
];

const BI_BRAND_ICONS = [
  { value: "bi-facebook", label: "Facebook" },
  { value: "bi-instagram", label: "Instagram" },
  { value: "bi-whatsapp", label: "WhatsApp" },
  { value: "bi-tiktok", label: "TikTok" },
  { value: "bi-twitter-x", label: "X (Twitter)" },
  { value: "bi-youtube", label: "YouTube" },
  { value: "bi-linkedin", label: "LinkedIn" },
  { value: "bi-telegram", label: "Telegram" },
];

export function IconPicker({ value, onChange, brand = false, bi = false }: { value?: string; onChange: (v: string) => void; brand?: boolean; bi?: boolean }) {
  const [open, setOpen] = useState(false);
  const list = brand ? (bi ? BI_BRAND_ICONS : FA_BRAND_ICONS) : (bi ? BI_ICONS : FA_ICONS);
  const matched = list.some((i) => i.value === value);
  return (
    <div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(!open)}
          className="inline-flex h-9 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#8a8a8a]/50 bg-white text-base text-[#303030] hover:bg-[#f7f7f7]">
          <i className={`${bi ? `bi ${value}` : value || "fa-solid fa-icons"}`} />
        </button>
        <input
          className="block w-full rounded-lg border border-[#8a8a8a]/50 bg-white px-2.5 py-1.5 text-[13px] text-[#303030] outline-none focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_25%,transparent)]"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={bi ? "Icono Bootstrap (bi-...)" : (matched ? "Icono Font Awesome" : "Clase personalizada (fa-...)")}
        />
      </div>
      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white shadow-lg p-2">
          <div className="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto pr-1">
            {list.map((ic) => (
              <button key={ic.value} type="button" title={ic.label} onClick={() => { onChange(ic.value); setOpen(false); }}
                className={`p-2 rounded-lg text-center ${value === ic.value ? "bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-[color:var(--color-primary)] ring-2 ring-[color:var(--color-primary)]" : "text-slate-500 hover:bg-slate-100"}`}>
                <i className={`${bi ? `bi ${ic.value}` : ic.value} text-base`} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setOpen(false)} className="mt-2 w-full py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600">Cerrar</button>
        </div>
      )}
    </div>
  );
}
