import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  private normalizeSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private hashToIndex(input: string, mod: number): number {
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
    return mod === 0 ? 0 : h % mod;
  }

  private getPalette(seed: string) {
    const palettes = [
      { primary: "#2563EB", secondary: "#1E40AF", accent: "#22C55E" },
      { primary: "#7C3AED", secondary: "#5B21B6", accent: "#F59E0B" },
      { primary: "#0EA5E9", secondary: "#0369A1", accent: "#A855F7" },
      { primary: "#16A34A", secondary: "#166534", accent: "#2563EB" },
      { primary: "#F97316", secondary: "#C2410C", accent: "#0EA5E9" },
      { primary: "#DB2777", secondary: "#9D174D", accent: "#F59E0B" },
      { primary: "#111827", secondary: "#0F172A", accent: "#2563EB" },
      { primary: "#0891B2", secondary: "#155E75", accent: "#F97316" },
    ];
    return palettes[this.hashToIndex(seed, palettes.length)];
  }

  private async canUsePremiumTemplates(tenantId: string): Promise<boolean> {
    if (!tenantId) return false;
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
      include: { plan: { select: { slug: true, price: true } } },
    });
    if (!tenant || !tenant.isActive) return false;
    if (tenant.plan && tenant.plan.slug !== "free" && Number(tenant.plan.price) > 0) return true;
    const activeSub = await this.prisma.subscription.findFirst({
      where: { tenantId, status: "active" },
      select: { id: true },
    });
    return Boolean(activeSub);
  }

  private buildTemplateDefaults(template: any) {
    const palette = this.getPalette(String(template.id));
    const safeName = String(template.name || "Plantilla").trim() || "Plantilla";
    const suffix = String(this.hashToIndex(String(template.id), 90) + 10);
    const brand = safeName.length > 24 ? safeName.slice(0, 24) : safeName;

    const ideasByCategory: Record<string, { tagline: string; services: string[]; highlights: string[] }> = {
      restaurantes: {
        tagline: "Sabores memorables, experiencia impecable.",
        services: ["Menú del día", "Reservas online", "Eventos privados"],
        highlights: ["Ingredientes frescos", "Delivery rápido", "Ambiente premium"],
      },
      "salud-y-belleza": {
        tagline: "Tu mejor versión, con un servicio de alto nivel.",
        services: ["Cortes y styling", "Tratamientos", "Citas online"],
        highlights: ["Profesionales certificados", "Productos premium", "Atención personalizada"],
      },
      negocios: {
        tagline: "Estrategia, ejecución y resultados medibles.",
        services: ["Consultoría", "Automatización", "Soporte continuo"],
        highlights: ["Implementación rápida", "Optimización constante", "ROI medible"],
      },
      "landing-pages": {
        tagline: "Convierte más visitas en clientes.",
        services: ["Diseño optimizado", "Copy persuasivo", "Integraciones"],
        highlights: ["Alta conversión", "Carga rápida", "Responsive"],
      },
    };

    const catSlug = template?.category?.slug ? String(template.category.slug) : "";
    const fallback = { tagline: "Una presencia digital moderna y clara.", services: ["Servicio 1", "Servicio 2", "Servicio 3"], highlights: ["Calidad", "Rapidez", "Confianza"] };
    const categoryIdeas = (catSlug && ideasByCategory[catSlug]) ? ideasByCategory[catSlug] : fallback;

    const testimonials = [
      { quote: "El sitio quedó impecable y empezamos a recibir más consultas desde el primer día.", name: "María", role: "Cliente" },
      { quote: "Diseño moderno, carga rápida y una experiencia profesional.", name: "Andrés", role: "Director" },
      { quote: "Nos ayudó a transmitir confianza y a vender mejor.", name: "Sofía", role: "Emprendedora" },
    ];
    const tIndex = this.hashToIndex(String(template.id), testimonials.length);
    const picked = [...testimonials.slice(tIndex), ...testimonials.slice(0, tIndex)];

    const placeholderColor = palette.primary.replace("#", "");
    const placeholderAccent = palette.accent.replace("#", "");
    const thumbnail = template.thumbnail
      ? String(template.thumbnail)
      : `https://placehold.co/1200x630/${placeholderColor}/FFFFFF?text=${encodeURIComponent(brand)}`;

    const galleryImages = Array.from({ length: 6 }).map((_, i) => ({
      url: `https://placehold.co/1200x800/${i % 2 === 0 ? placeholderColor : placeholderAccent}/FFFFFF?text=${encodeURIComponent(`${brand} ${suffix}-${i + 1}`)}`,
      alt: `${brand} ${i + 1}`,
    }));

    return {
      palette,
      brand,
      suffix,
      categoryIdeas,
      testimonials: picked,
      galleryImages,
      thumbnail,
    };
  }

  async findAllForTenant(tenantId: string, categoryId?: string) {
    const where: any = {};
    where.isActive = true;
    if (categoryId) where.categoryId = categoryId;
    const canUsePremium = await this.canUsePremiumTemplates(tenantId);
    if (!canUsePremium) where.isPremium = false;

    return this.prisma.template.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { pages: true, sites: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async adminFindAll(categoryId?: string) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    return this.prisma.template.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { pages: true, sites: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdForTenant(id: string, tenantId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: {
        category: true,
        pages: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!template) throw new NotFoundException("Template not found");
    if (!template.isActive) throw new ForbiddenException("Template is not available");
    if (template.isPremium) {
      const canUsePremium = await this.canUsePremiumTemplates(tenantId);
      if (!canUsePremium) throw new ForbiddenException("This template requires a paid plan");
    }
    return template;
  }

  async adminFindById(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: {
        category: true,
        pages: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!template) throw new NotFoundException("Template not found");
    return template;
  }

  async getCategories() {
    return this.prisma.templateCategory.findMany({
      orderBy: { sortOrder: "asc" },
    });
  }

  async createFromSite(siteId: string, name: string, description?: string) {
    if (!name?.trim()) throw new BadRequestException("Name is required");
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: {
        pages: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!site) throw new NotFoundException("Site not found");

    const template = await this.prisma.template.create({
      data: {
        name: name.trim(),
        description: description?.trim() || undefined,
        globalStyles: site.settings as any,
      },
    });

    const allBlocksData: Array<{
      templatePageId: string; type: string; content: any; styles: any; sortOrder: number;
    }> = [];

    for (const page of site.pages) {
      const tp = await this.prisma.templatePage.create({
        data: {
          templateId: template.id,
          name: page.name,
          slug: page.slug,
          path: page.path,
          isDefault: page.isDefault,
          sortOrder: page.sortOrder,
        },
      });

      for (const b of page.blocks) {
        allBlocksData.push({
          templatePageId: tp.id,
          type: b.type,
          content: b.content as any,
          styles: b.styles as any,
          sortOrder: b.sortOrder,
        });
      }
    }

    if (allBlocksData.length > 0) {
      await this.prisma.templateBlock.createMany({ data: allBlocksData });
    }

    return template;
  }

  async diversifyAllTemplates() {
    const templates = await this.prisma.template.findMany({
      where: {},
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    let updated = 0;
    const BATCH_SIZE = 10;
    for (let i = 0; i < templates.length; i += BATCH_SIZE) {
      const batch = templates.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((t) => this.diversifyTemplate(t.id))
      );
      updated += results.filter((r) => r?.updated).length;
    }

    return { updated, total: templates.length };
  }

  async diversifyTemplate(templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: {
        category: { select: { id: true, slug: true } },
        pages: {
          include: { blocks: { orderBy: { sortOrder: "asc" } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!template) throw new NotFoundException("Template not found");

    const { palette, brand, suffix, categoryIdeas, testimonials, galleryImages, thumbnail } =
      this.buildTemplateDefaults(template);

    const updates: Array<{ id: string; content: any }> = [];

    for (const page of template.pages || []) {
      for (const block of page.blocks || []) {
        const c = (block as any).content || {};
        let next = { ...c };

        if (block.type === "hero") {
          next.primaryColor = palette.primary;
          next.secondaryColor = palette.secondary;
          next.kicker = next.kicker || (template.category?.slug ? String(template.category.slug).replace(/-/g, " ").toUpperCase() : `PLANTILLA ${suffix}`);
          next.title = next.title || `${brand}`;
          next.subtitle = next.subtitle || categoryIdeas.tagline;
          next.buttonText = next.buttonText || "Reservar / Contactar";
          next.buttonUrl = next.buttonUrl || "#contact";
          next.secondaryButtonText = next.secondaryButtonText || "Ver servicios";
          next.secondaryButtonUrl = next.secondaryButtonUrl || "#services";
          next.highlights = Array.isArray(next.highlights) && next.highlights.length > 0 ? next.highlights : categoryIdeas.highlights;
        } else if (block.type === "services") {
          next.title = next.title || "Servicios";
          next.subtitle = next.subtitle || "Soluciones claras, con una experiencia profesional.";
          const items = Array.isArray(next.items) ? next.items : [];
          if (items.length === 0) {
            next.items = categoryIdeas.services.map((s, i) => ({
              title: s,
              desc: "Descripción breve enfocada en beneficio y resultado.",
              icon: i === 0 ? "⚡" : i === 1 ? "✅" : "⭐",
            }));
          }
        } else if (block.type === "cta") {
          next.primaryColor = palette.primary;
          next.secondaryColor = palette.secondary;
          next.title = next.title || "Agenda hoy";
          next.subtitle = next.subtitle || "Te respondemos con una propuesta clara y rápida.";
          next.buttonText = next.buttonText || "Escríbenos";
          next.buttonUrl = next.buttonUrl || "#contact";
          next.secondaryButtonText = next.secondaryButtonText || "Ver más";
          next.secondaryButtonUrl = next.secondaryButtonUrl || "#";
        } else if (block.type === "testimonials") {
          next.title = next.title || "Lo que dicen nuestros clientes";
          next.subtitle = next.subtitle || "Resultados reales y confianza desde el primer contacto.";
          const items = Array.isArray(next.items) ? next.items : [];
          if (items.length === 0) {
            next.items = testimonials;
          } else {
            next.items = items.map((it: any, i: number) => ({
              quote: it.quote || testimonials[i % testimonials.length].quote,
              name: it.name || testimonials[i % testimonials.length].name,
              role: it.role || testimonials[i % testimonials.length].role,
            }));
          }
        } else if (block.type === "gallery") {
          next.title = next.title || "Galería";
          next.subtitle = next.subtitle || "Una muestra de calidad, detalle y estilo.";
          const imgs = Array.isArray(next.images) ? next.images : [];
          if (imgs.length === 0) next.images = galleryImages;
        } else if (block.type === "header") {
          next.logoText = next.logoText || brand;
          next.ctaText = next.ctaText || "Cotizar";
          next.ctaUrl = next.ctaUrl || "#contact";
          const links = Array.isArray(next.links) ? next.links : [];
          if (links.length === 0) {
            next.links = [
              { label: "Inicio", url: "/" },
              { label: "Servicios", url: "#services" },
              { label: "Contacto", url: "#contact" },
            ];
          }
        } else if (block.type === "footer") {
          next.companyName = next.companyName || brand;
          next.description = next.description || categoryIdeas.tagline;
          const columns = Array.isArray(next.columns) ? next.columns : [];
          if (columns.length === 0) {
            next.columns = [
              { title: "Empresa", links: [{ label: "Sobre nosotros", url: "#" }, { label: "Servicios", url: "#services" }] },
              { title: "Contacto", links: [{ label: "WhatsApp", url: "#contact" }, { label: "Email", url: "#contact" }] },
            ];
          }
          next.copyright =
            next.copyright || `© ${new Date().getFullYear()} ${brand}. Todos los derechos reservados.`;
        }

        const changed = JSON.stringify(next) !== JSON.stringify(c);
        if (changed) updates.push({ id: block.id, content: next });
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (!template.thumbnail) {
        await tx.template.update({
          where: { id: template.id },
          data: { thumbnail },
        });
      }
      for (const u of updates) {
        await tx.templateBlock.update({
          where: { id: u.id },
          data: { content: u.content as any },
        });
      }
    });

    return { updated: updates.length > 0, blocksUpdated: updates.length };
  }

  async applyPortfolioCreativoPreset(templateId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: { category: { select: { id: true, slug: true } } },
    });
    if (!template) throw new NotFoundException("Template not found");

    const palette = { primary: "#7C3AED", secondary: "#DB2777", accent: "#F59E0B" };
    const brand = template.name?.trim() || "Portafolio Creativo";
    const thumb = template.thumbnail || `https://placehold.co/1200x630/7C3AED/FFFFFF?text=${encodeURIComponent(brand)}`;

    const pages = [
      { name: "Inicio", slug: "home", path: "/", isDefault: true, sortOrder: 0 },
      { name: "Portafolio", slug: "portfolio", path: "/portfolio", isDefault: false, sortOrder: 1 },
      { name: "Sobre mí", slug: "about", path: "/about", isDefault: false, sortOrder: 2 },
    ];

    const header = {
      type: "header",
      content: {
        logoText: brand,
        links: [
          { label: "Inicio", url: "/" },
          { label: "Portafolio", url: "/portfolio" },
          { label: "Servicios", url: "#services" },
          { label: "Contacto", url: "#contact" },
        ],
        ctaText: "Contratar",
        ctaUrl: "#contact",
      },
    };

    const footer = {
      type: "footer",
      content: {
        companyName: brand,
        description: "Dirección de arte, branding y diseño web con enfoque en conversión y detalle.",
        columns: [
          { title: "Secciones", links: [{ label: "Portafolio", url: "/portfolio" }, { label: "Servicios", url: "#services" }] },
          { title: "Contacto", links: [{ label: "WhatsApp", url: "#contact" }, { label: "Email", url: "#contact" }] },
        ],
        social: [
          { label: "Instagram", url: "#" },
          { label: "Behance", url: "#" },
          { label: "Dribbble", url: "#" },
        ],
      },
    };

    const homeBlocks = [
      header,
      {
        type: "hero",
        content: {
          primaryColor: palette.primary,
          secondaryColor: palette.secondary,
          kicker: "PORTAFOLIO · BRANDING · DISEÑO",
          title: brand,
          subtitle: "Identidad visual, dirección de arte y experiencias digitales que se sienten premium en cualquier dispositivo.",
          buttonText: "Ver trabajos",
          buttonUrl: "#portfolio",
          secondaryButtonText: "Contactar",
          secondaryButtonUrl: "#contact",
          highlights: ["Branding", "UI/UX", "Webflow/Next.js", "Contenido para RRSS", "E-commerce", "SEO"],
        },
      },
      {
        type: "stats",
        content: {
          title: "Resultados y enfoque",
          subtitle: "Cada proyecto se diseña con un objetivo claro: comunicar mejor y convertir más.",
          items: [
            { value: "120+", label: "Proyectos entregados", desc: "Branding, landing pages y e-commerce" },
            { value: "8 años", label: "Experiencia", desc: "Diseño digital y dirección de arte" },
            { value: "30+", label: "Marcas", desc: "Startups y negocios en crecimiento" },
            { value: "4.9/5", label: "Satisfacción", desc: "Feedback constante y mejora continua" },
          ],
        },
      },
      {
        type: "portfolio",
        content: {
          title: "Proyectos destacados",
          subtitle: "Selección curada de trabajos recientes. Diseño limpio, tipografía, color y detalle.",
          categories: ["Branding", "Web", "E-commerce", "Social"],
          items: [
            { title: "Identidad · Studio Aurora", category: "Branding", desc: "Sistema visual completo con guías, paleta y tipografías.", image: `https://placehold.co/1200x800/111827/FFFFFF?text=Aurora`, tags: ["Logo", "Guía", "Packaging"], link: "#" },
            { title: "Landing · Evento Prisma", category: "Web", desc: "Landing optimizada para conversiones con secciones claras.", image: `https://placehold.co/1200x800/7C3AED/FFFFFF?text=Prisma`, tags: ["Landing", "UI", "Copy"], link: "#" },
            { title: "E-commerce · Lumen", category: "E-commerce", desc: "Catálogo, checkout y experiencia mobile-first.", image: `https://placehold.co/1200x800/DB2777/FFFFFF?text=Lumen`, tags: ["Shop", "UX", "Mobile"], link: "#" },
            { title: "Campaña · Nébula", category: "Social", desc: "Sistema de piezas para redes con consistencia visual.", image: `https://placehold.co/1200x800/F59E0B/111827?text=Nebula`, tags: ["RRSS", "Plantillas"], link: "#" },
            { title: "Brand Refresh · Citrus", category: "Branding", desc: "Rediseño con foco en modernidad y legibilidad.", image: `https://placehold.co/1200x800/0EA5E9/FFFFFF?text=Citrus`, tags: ["Rebrand", "Color"], link: "#" },
            { title: "Web · Consultoría Atlas", category: "Web", desc: "Web institucional con secciones y jerarquía clara.", image: `https://placehold.co/1200x800/16A34A/FFFFFF?text=Atlas`, tags: ["Web", "SEO"], link: "#" },
          ],
        },
      },
      {
        type: "services",
        content: {
          title: "Servicios",
          subtitle: "Paquetes flexibles, pensados para impulsar tu marca y tu presencia digital.",
          items: [
            { icon: "🎨", title: "Branding", desc: "Logo, sistema visual, tipografía y guía de marca." },
            { icon: "🧩", title: "UI/UX", desc: "Diseño de interfaces con foco en claridad y conversión." },
            { icon: "🖥️", title: "Web", desc: "Sitios responsive, rápidos y escalables." },
            { icon: "🛍️", title: "E-commerce", desc: "Catálogo, checkout y UX que vende." },
            { icon: "📣", title: "Contenido RRSS", desc: "Piezas y plantillas con coherencia visual." },
            { icon: "⚙️", title: "Optimización", desc: "SEO básico, performance y mejoras continuas." },
          ],
        },
      },
      {
        type: "testimonials",
        content: {
          title: "Clientes felices",
          subtitle: "Trabajo colaborativo, entregables claros y experiencia premium.",
          items: [
            { quote: "El resultado superó expectativas. Se siente premium y funciona perfecto en móvil.", name: "Valentina", role: "Founder" },
            { quote: "La identidad quedó coherente y moderna. Todo se ve consistente.", name: "Diego", role: "CMO" },
            { quote: "Rápido, prolijo y con excelente criterio de diseño.", name: "Camila", role: "Emprendedora" },
          ],
        },
      },
      {
        type: "faq",
        content: {
          title: "Preguntas frecuentes",
          subtitle: "Respuestas rápidas para que avances con claridad.",
          items: [
            { question: "¿Qué incluye el paquete de branding?", answer: "Logo, variantes, paleta, tipografías, aplicaciones y guía rápida." },
            { question: "¿Cuánto tarda un proyecto?", answer: "Depende del alcance. Normalmente entre 1 y 4 semanas por fase." },
            { question: "¿Puedo pedir cambios?", answer: "Sí, trabajamos con rondas de revisión para asegurar el resultado." },
            { question: "¿La web es responsive?", answer: "Sí. Se diseña para móvil, tablet y desktop con pruebas reales." },
            { question: "¿Qué necesito para empezar?", answer: "Un brief simple: objetivos, referencias, servicios y público objetivo." },
          ],
        },
      },
      {
        type: "cta",
        content: {
          primaryColor: palette.primary,
          secondaryColor: palette.secondary,
          title: "¿Trabajamos juntos?",
          subtitle: "Cuéntame sobre tu proyecto y te respondo con una propuesta clara.",
          buttonText: "Escríbeme",
          buttonUrl: "#contact",
          secondaryButtonText: "Ver portafolio",
          secondaryButtonUrl: "/portfolio",
        },
      },
      footer,
    ];

    const portfolioItems =
      (homeBlocks as any).find((b: any) => b.type === "portfolio")?.content?.items || [];

    const portfolioBlocks = [
      header,
      {
        type: "hero",
        content: {
          primaryColor: palette.secondary,
          secondaryColor: palette.primary,
          kicker: "PROYECTOS",
          title: "Portafolio",
          subtitle: "Explora una selección de proyectos con foco en tipografía, composición y detalle.",
          buttonText: "Contactar",
          buttonUrl: "#contact",
          secondaryButtonText: "Volver al inicio",
          secondaryButtonUrl: "/",
          highlights: ["Branding", "Web", "E-commerce", "RRSS"],
        },
      },
      {
        type: "portfolio",
        content: {
          title: "Galería de trabajos",
          subtitle: "Diseños pensados para funcionar y verse impecables en móvil, tablet y desktop.",
          categories: ["Branding", "Web", "E-commerce", "Social"],
          items: portfolioItems,
        },
      },
      {
        type: "cta",
        content: {
          primaryColor: palette.primary,
          secondaryColor: palette.secondary,
          title: "¿Quieres algo así para tu marca?",
          subtitle: "Te ayudo a definir una identidad clara y una web lista para convertir.",
          buttonText: "Hablemos",
          buttonUrl: "#contact",
          secondaryButtonText: "Ver servicios",
          secondaryButtonUrl: "#services",
        },
      },
      footer,
    ];

    const aboutBlocks = [
      header,
      {
        type: "hero",
        content: {
          primaryColor: palette.primary,
          secondaryColor: palette.secondary,
          kicker: "SOBRE MÍ",
          title: "Diseño con intención",
          subtitle: "Trabajo con marcas que buscan verse profesionales y comunicar con claridad.",
          buttonText: "Ver trabajos",
          buttonUrl: "/portfolio",
          secondaryButtonText: "Contactar",
          secondaryButtonUrl: "#contact",
          highlights: ["Dirección de arte", "Brand systems", "Diseño responsive", "Iteración rápida"],
        },
      },
      {
        type: "services",
        content: {
          title: "Proceso",
          subtitle: "Un flujo simple para avanzar rápido, con checkpoints claros.",
          items: [
            { icon: "🧠", title: "Descubrimiento", desc: "Objetivos, público, referencias y tono de marca." },
            { icon: "🧪", title: "Exploración", desc: "Moodboards, tipografía y rutas visuales." },
            { icon: "🧱", title: "Sistema", desc: "Componentes, grilla y consistencia." },
            { icon: "🚀", title: "Entrega", desc: "Assets finales, guía y handoff prolijo." },
            { icon: "🔁", title: "Iteración", desc: "Rondas de feedback con cambios concretos." },
            { icon: "📈", title: "Optimización", desc: "Ajustes por performance y conversión." },
          ],
        },
      },
      {
        type: "cta",
        content: {
          primaryColor: palette.secondary,
          secondaryColor: palette.primary,
          title: "¿Listo para elevar tu marca?",
          subtitle: "Deja tu mensaje y agendamos una llamada.",
          buttonText: "Contactar",
          buttonUrl: "#contact",
          secondaryButtonText: "Portafolio",
          secondaryButtonUrl: "/portfolio",
        },
      },
      footer,
    ];

    await this.prisma.$transaction(async (tx) => {
      await tx.templatePage.deleteMany({ where: { templateId: template.id } });
      await tx.template.update({
        where: { id: template.id },
        data: {
          description: "Plantilla de portafolio moderna: proyectos, servicios, testimonios y secciones premium responsive.",
          thumbnail: thumb,
        },
      });

      const createdPages = new Map<string, string>();
      for (const p of pages) {
        const created = await tx.templatePage.create({
          data: {
            templateId: template.id,
            name: p.name,
            slug: p.slug,
            path: p.path,
            isDefault: p.isDefault,
            sortOrder: p.sortOrder,
          },
        });
        createdPages.set(p.slug, created.id);
      }

      const createBlocks = async (pageSlug: string, blocks: Array<{ type: string; content: any }>) => {
        const pageId = createdPages.get(pageSlug);
        if (!pageId) return;
        await tx.templateBlock.createMany({
          data: blocks.map((b, i) => ({
            templatePageId: pageId,
            type: b.type,
            content: b.content as any,
            sortOrder: i,
          })),
        });
      };

      await createBlocks("home", homeBlocks as any);
      await createBlocks("portfolio", portfolioBlocks as any);
      await createBlocks("about", aboutBlocks as any);
    });

    return { updated: true };
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      isActive?: boolean;
      isPremium?: boolean;
      categoryId?: string | null;
      tags?: string[] | null;
      thumbnail?: string | null;
    }
  ) {
    const t = await this.prisma.template.findUnique({ where: { id } });
    if (!t) throw new NotFoundException("Template not found");

    const patch: any = {};
    if (data.name !== undefined) {
      const name = String(data.name).trim();
      if (!name) throw new BadRequestException("Name is required");
      patch.name = name;
    }
    if (data.description !== undefined) patch.description = data.description ? String(data.description).trim() : null;
    if (data.isActive !== undefined) patch.isActive = Boolean(data.isActive);
    if (data.isPremium !== undefined) patch.isPremium = Boolean(data.isPremium);
    if (data.thumbnail !== undefined) patch.thumbnail = data.thumbnail ? String(data.thumbnail).trim() : null;

    if (data.categoryId !== undefined) {
      if (data.categoryId === null || data.categoryId === "") {
        patch.categoryId = null;
      } else {
        const exists = await this.prisma.templateCategory.findUnique({ where: { id: String(data.categoryId) } });
        if (!exists) throw new NotFoundException("Category not found");
        patch.categoryId = String(data.categoryId);
      }
    }

    if (data.tags !== undefined) {
      if (data.tags === null) {
        patch.tags = null;
      } else if (Array.isArray(data.tags)) {
        const tags = data.tags
          .map((x) => String(x).trim())
          .filter(Boolean)
          .slice(0, 20);
        patch.tags = tags;
      } else {
        throw new BadRequestException("tags must be an array");
      }
    }

    return this.prisma.template.update({ where: { id }, data: patch });
  }

  async createCategory(dto: { name: string; slug?: string }) {
    const name = dto?.name?.trim();
    if (!name) throw new BadRequestException("Name is required");
    const slug = this.normalizeSlug(dto.slug?.trim() || name);
    if (!slug) throw new BadRequestException("Invalid slug");

    const existingSlug = await this.prisma.templateCategory.findUnique({ where: { slug } });
    if (existingSlug) throw new ConflictException("Slug already taken");

    const existingName = await this.prisma.templateCategory.findUnique({ where: { name } });
    if (existingName) throw new ConflictException("Name already taken");

    return this.prisma.templateCategory.create({ data: { name, slug } });
  }
}
