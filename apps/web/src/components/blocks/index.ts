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
  image: { label: "Imagen", icon: "Image", description: "Imagen con texto alternativo, enlace y caption" },
  video: { label: "Video", icon: "Play", description: "Video de YouTube o Vimeo embebido" },
  "review-form": { label: "Formulario Reseñas", icon: "Star", description: "Captador de reseñas para clientes reales" },
};
