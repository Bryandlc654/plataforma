import {
  getBlockDefaultContent,
  BLOCK_TYPES,
} from "@/lib/block-defaults/defaults";

export { getBlockDefaultContent, BLOCK_TYPES };

export interface BlockData {
  type: string;
  content: any;
  styles?: any;
}

export const BLOCK_META: Record<string, { label: string; icon: string; description: string }> = {
  hero: { label: "Hero", icon: "Layout", description: "Sección principal con título, subtítulo y botón" },
  services: { label: "Servicios", icon: "Grid", description: "Tarjetas de servicios en grid" },
  faq: { label: "FAQ", icon: "HelpCircle", description: "Preguntas frecuentes desplegables" },
  cta: { label: "CTA", icon: "Megaphone", description: "Llamado a la acción con botón" },
  testimonials: { label: "Testimonios", icon: "MessageSquare", description: "Testimonios de clientes" },
  gallery: { label: "Galería", icon: "Image", description: "Galería de imágenes" },
  header: { label: "Header", icon: "PanelTop", description: "Encabezado con logo y navegación" },
  footer: { label: "Footer", icon: "PanelBottom", description: "Pie de página con enlaces" },
  form: { label: "Formulario", icon: "ClipboardList", description: "Formulario conectado al CRM" },
  about: { label: "Sobre nosotros", icon: "Info", description: "Sección de presentación con texto e imagen" },
  contact: { label: "Contacto", icon: "Mail", description: "Formulario de contacto estático" },
  whatsapp: { label: "WhatsApp", icon: "MessageCircle", description: "Botón flotante de WhatsApp" },
  pricing: { label: "Precios", icon: "DollarSign", description: "Tabla de planes y precios" },
  team: { label: "Equipo", icon: "Users", description: "Presentación de miembros del equipo" },
  features: { label: "Características", icon: "Star", description: "Lista de características con iconos" },
  stats: { label: "Estadísticas", icon: "BarChart", description: "Indicadores numéricos animados" },
  portfolio: { label: "Portafolio", icon: "Briefcase", description: "Galería de productos o proyectos" },
  benefits: { label: "Beneficios", icon: "Sparkles", description: "Ventajas o beneficios en carrusel" },
  process: { label: "Proceso", icon: "GitBranch", description: "Pasos de un proceso o metodología" },
  timeline: { label: "Línea de tiempo", icon: "CalendarClock", description: "Historia o hitos en línea de tiempo" },
  clients: { label: "Logos / Formación", icon: "Award", description: "Sección con título y logos en rectángulo (fondo #2d2e81)" },
  image: { label: "Imagen", icon: "Image", description: "Imagen con texto alternativo, enlace y caption" },
  video: { label: "Video", icon: "Play", description: "Video de YouTube o Vimeo embebido" },
  "review-form": { label: "Formulario Reseñas", icon: "Star", description: "Captador de reseñas para clientes reales" },
  // Secciones propias de las plantillas de diseño
  "page-hero": { label: "Portada de página", icon: "Layout", description: "Título grande para páginas interiores" },
  marquee: { label: "Texto en movimiento", icon: "Megaphone", description: "Palabras que se desplazan en una franja" },
  agency: { label: "Agencia", icon: "Info", description: "Presentación con imagen y cifras" },
  awareness: { label: "Mensaje destacado", icon: "Megaphone", description: "Frase de impacto con texto resaltado" },
  "portfolio-grid": { label: "Proyectos destacados", icon: "Briefcase", description: "Cuadrícula de proyectos con llamado a la acción" },
  "contact-section": { label: "Contacto completo", icon: "Mail", description: "Datos de contacto y formulario" },
  "hero-story": { label: "Historia", icon: "Info", description: "Historia del negocio con imágenes" },
  "video-banner": { label: "Video de fondo", icon: "Play", description: "Franja con video o imagen de fondo" },
  menu: { label: "Menú", icon: "ClipboardList", description: "Carta de platos con precios" },
  "lunch-menu": { label: "Menú del día", icon: "ClipboardList", description: "Menú de almuerzo destacado" },
  location: { label: "Ubicación", icon: "Info", description: "Dirección, horarios y mapa" },
};
