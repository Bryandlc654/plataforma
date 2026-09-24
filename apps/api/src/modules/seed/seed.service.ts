import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DEFAULT_PLANS, PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "../../shared/index";

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const enabled =
      process.env.SEED_ON_STARTUP === "true" || process.env.NODE_ENV !== "production";
    if (!enabled) {
      this.logger.log("Seed disabled, skipping");
      return;
    }
    try {
      await this.seedPermissions();
      await this.seedRoles();
      await this.seedRolePermissions();
      await this.seedPlans();
      await this.seedEcommerceTemplate();
      this.logger.log("Database seeded successfully");
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Unknown error";
      this.logger.error(`Seed failed: ${msg}`);
    }
  }

  private async seedPermissions() {
    const permissionEntries = (Object.values(PERMISSIONS) as string[]).map((name: string) => {
      const [resource, action] = name.split(".");
      return { name, resource, action };
    });

    let synced = 0;
    for (const entry of permissionEntries) {
      try {
        await this.prisma.permission.upsert({
          where: { name: entry.name },
          update: {},
          create: entry,
        });
        synced++;
      } catch (err: any) {
        this.logger.warn(`Permission ${entry.name} sync failed: ${err?.message}`);
      }
    }

    this.logger.log(`Permissions synced (${synced}/${permissionEntries.length})`);
  }

  private async seedRoles() {
    const roleEntries = (Object.entries(ROLES) as Array<[string, string]>).map(([, name]: [string, string]) => ({
      name,
      description: this.getRoleDescription(name),
      level: name === "super_admin" || name === "support" ? "platform" : "tenant",
      isSystem: true,
    }));

    let synced = 0;
    for (const entry of roleEntries) {
      try {
        const existing = await this.prisma.role.findFirst({
          where: { name: entry.name, tenantId: null },
        });
        if (existing) {
          await this.prisma.role.update({
            where: { id: existing.id },
            data: {
              description: entry.description,
              level: entry.level,
              isSystem: true,
            },
          });
        } else {
          await this.prisma.role.create({ data: entry });
        }
        synced++;
      } catch (err: any) {
        this.logger.warn(`Role ${entry.name} sync failed: ${err?.message}`);
      }
    }

    this.logger.log(`System roles synced (${synced}/${roleEntries.length})`);
  }

  private async seedRolePermissions() {
    const roles = await this.prisma.role.findMany({
      where: { isSystem: true },
      select: { id: true, name: true },
    });
    const permissions = await this.prisma.permission.findMany({
      select: { id: true, name: true },
    });

    const permByName = new Map(permissions.map((p) => [p.name, p.id]));

    let total = 0;
    for (const role of roles) {
      const canonical =
        role.name === "super_admin"
          ? permissions.map((p) => p.id)
          : (ROLE_PERMISSIONS[role.name as keyof typeof ROLE_PERMISSIONS] || [])
              .map((name) => permByName.get(name))
              .filter((id): id is string => !!id);

      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
        this.prisma.rolePermission.createMany({
          data: canonical.map((permissionId) => ({ roleId: role.id, permissionId })),
        }),
      ]);
      total += canonical.length;
    }

    this.logger.log(`System role-permissions reconciled (${total} assignments)`);
  }

  private async seedPlans() {
    const existing = await this.prisma.plan.count();
    if (existing > 0) {
      this.logger.log("Plans already seeded, skipping");
      return;
    }

    const planData = DEFAULT_PLANS.map((plan, index) => ({
      ...plan,
      currency: "USD",
      billingInterval: "monthly",
      features: JSON.parse(JSON.stringify(plan.features)),
      sortOrder: index,
    }));

    await this.prisma.plan.createMany({
      data: planData as any,
      skipDuplicates: true,
    });

    this.logger.log(`Seeded ${DEFAULT_PLANS.length} plans`);
  }

  async seedEcommerceTemplate() {
    const category = await this.prisma.templateCategory.upsert({
      where: { slug: "ecommerce" },
      update: {},
      create: {
        name: "E-commerce",
        slug: "ecommerce",
        description: "Plantillas para tiendas online con catalogo de productos",
        sortOrder: 10,
      },
    });

    const existing = await this.prisma.template.findFirst({
      where: { name: "URBAN NOIR" },
    });
    if (existing) {
      this.logger.log("URBAN NOIR template already seeded, skipping");
      return;
    }

    const template = await this.prisma.template.create({
      data: {
        name: "URBAN NOIR",
        description:
          "Tienda streetwear en escala de grises. Catalogo por categorias, promociones, beneficios y newsletter para conversion.",
        thumbnail: "https://placehold.co/1200x800/111827/FFFFFF?text=URBAN+NOIR",
        categoryId: category.id,
        tags: ["ecommerce", "e-commerce", "tienda", "shop", "streetwear", "urbano", "calle"],
        isPremium: false,
        isActive: true,
        globalStyles: {
          backgroundColor: "#0A0A0B",
          color: "#F1F1F1",
          fontFamily: "system-ui, sans-serif",
        },
      },
    });

    const home = await this.prisma.templatePage.create({
      data: {
        templateId: template.id,
        name: "Inicio",
        slug: "home",
        path: "/",
        isDefault: true,
        sortOrder: 0,
        seoTitle: "URBAN NOIR — Ropa urbana",
        seoDesc: "Tienda streetwear con catalogo, promociones y envio rapido",
      },
    });

    const blocks = [
      {
        type: "header",
        sortOrder: 0,
        content: {
          variant: "urban-noir",
          logoText: "URBAN NOIR",
          links: [
            { label: "Inicio", url: "/" },
            { label: "Catálogo", url: "#catalogo" },
            { label: "Promos", url: "#promociones" },
            { label: "Nosotros", url: "#beneficios" },
          ],
        },
        styles: { sticky: true },
      },
      {
        type: "hero",
        sortOrder: 1,
        content: {
          variant: "urban-noir",
          anchor: "inicio",
          kicker: "Colección Fall/Winter",
          title: "REDEFINE YOUR STREETS",
          subtitle:
            "Estilo urbano, minimalista y sin compromisos. Descubre prendas diseñadas para la ciudad moderna.",
          buttonText: "Explorar Colección",
          buttonUrl: "#catalogo",
          backgroundImage:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2048&auto=format&fit=crop",
        },
      },
      {
        type: "features",
        sortOrder: 2,
        content: {
          variant: "urban-noir",
          anchor: "catalogo",
          title: "Catálogo",
          linkText: "Ver todas las categorías",
          linkUrl: "#",
          items: [
            { image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop", title: "Hombres", link: "#" },
            { image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop", title: "Mujeres", link: "#" },
            { image: "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=800&auto=format&fit=crop", title: "Accesorios", link: "#" },
            { image: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop", title: "Streetwear", link: "#" },
          ],
        },
      },
      {
        type: "cta",
        sortOrder: 3,
        content: {
          variant: "urban-noir",
          anchor: "promociones",
          newsletter: false,
          kicker: "Oferta Especial",
          title: "HASTA 50%\nDE DESCUENTO",
          subtitle:
            "Actualiza tu armario con nuestras piezas de temporada a mitad de precio. Solo por tiempo limitado.",
          buttonText: "Comprar Ahora",
          buttonUrl: "#",
          watermark: "SALE SALE SALE",
          backgroundImage:
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop",
        },
      },
      {
        type: "portfolio",
        sortOrder: 4,
        content: {
          variant: "urban-noir",
          anchor: "productos",
          title: "MÁS BUSCADOS",
          subtitle: "Las piezas clave de esta temporada que no pueden faltar en tu rotación.",
          buttonText: "Ver Todo el Catálogo",
          buttonUrl: "#",
          items: [
            { image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop", title: "Camiseta Oversize", desc: "Algodón Heavyweight", price: "45.00" },
            { image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop", tag: "Nuevo", title: "Hoodie Esencial", desc: "Negro Intenso", price: "89.00" },
            { image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop", title: "Chaqueta Utility", desc: "Resistente al agua", price: "120.00" },
            { image: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?q=80&w=600&auto=format&fit=crop", tag: "-20%", title: "Pantalón Cargo", desc: "Ajuste relajado", price: "75.00", compareAt: "95.00" },
          ],
        },
      },
      {
        type: "benefits",
        sortOrder: 5,
        content: {
          variant: "urban-noir",
          anchor: "beneficios",
          items: [
            { icon: "🚚", title: "Envío Gratis", desc: "En todas las órdenes superiores a $100. Entregas express disponibles globalmente." },
            { icon: "🛡️", title: "Calidad Premium", desc: "Materiales seleccionados meticulosamente para garantizar durabilidad y confort." },
            { icon: "💳", title: "Pagos Seguros", desc: "Procesamiento cifrado y múltiples opciones de pago internacional para tu tranquilidad." },
          ],
        },
      },
      {
        type: "cta",
        sortOrder: 6,
        content: {
          variant: "urban-noir",
          newsletter: true,
          title: "ÚNETE AL CLUB",
          subtitle:
            "Suscríbete a nuestra newsletter y obtén un 15% de descuento en tu primera compra. Acceso anticipado a colecciones y eventos exclusivos.",
          buttonText: "Suscribirse",
        },
      },
      {
        type: "footer",
        sortOrder: 7,
        content: {
          variant: "urban-noir",
          companyName: "URBAN NOIR",
          description:
            "Definiendo la estética de la calle contemporánea. Menos ruido, más actitud. Diseñado para el individuo moderno.",
          columns: [
            { title: "Tienda", links: [{ label: "Hombres", url: "#" }, { label: "Mujeres", url: "#" }, { label: "Accesorios", url: "#" }, { label: "Novedades", url: "#" }, { label: "Ofertas", url: "#" }] },
            { title: "Ayuda", links: [{ label: "FAQ", url: "#" }, { label: "Envíos y Devoluciones", url: "#" }, { label: "Rastreo de Pedido", url: "#" }, { label: "Guía de Tallas", url: "#" }, { label: "Contacto", url: "#" }] },
          ],
          social: [
            { label: "Instagram", url: "#" },
            { label: "Twitter", url: "#" },
          ],
          copyright: "© 2026 URBAN NOIR. Todos los derechos reservados.",
        },
      },
    ];

    await this.prisma.templateBlock.createMany({
      data: blocks.map((b, i) => ({
        templatePageId: home.id,
        type: b.type,
        content: b.content as any,
        styles: b.styles as any,
        sortOrder: i,
      })) as any,
    });

    const headerBlock = blocks.find((b) => b.type === "header");
    const heroBlock = blocks.find((b) => b.type === "hero");
    const footerBlock = blocks.find((b) => b.type === "footer");
    const errorPage = await this.prisma.templatePage.create({
      data: {
        templateId: template.id,
        name: "404",
        slug: "404",
        path: "/404",
        isDefault: false,
        sortOrder: 999,
      },
    });
    const errorBlocks: any[] = [];
    if (headerBlock) errorBlocks.push(headerBlock);
    errorBlocks.push({
      type: "hero",
      styles: (heroBlock as any)?.styles,
      content: {
        ...((heroBlock?.content as any) || {}),
        title: "404",
        subtitle: "No encontramos la página que buscas.",
        buttonText: "Volver al inicio",
        buttonUrl: "/",
      },
    });
    if (footerBlock) errorBlocks.push(footerBlock);
    await this.prisma.templateBlock.createMany({
      data: errorBlocks.map((b, i) => ({
        templatePageId: errorPage.id,
        type: b.type,
        content: b.content as any,
        styles: b.styles as any,
        sortOrder: i,
      })),
    });

    this.logger.log("URBAN NOIR ecommerce template seeded");
  }

  private getRoleDescription(name: string): string {
    const descriptions: Record<string, string> = {
      super_admin: "Administrador principal de la plataforma SaaS",
      support: "Equipo de soporte tecnico y comercial",
      owner: "Propietario del negocio, maximo administrador del tenant",
      admin: "Administrador operativo del negocio",
      editor: "Usuario encargado de modificar contenido del sitio",
      marketing: "Responsable de campanas y conversion",
      billing: "Encargado financiero del tenant",
      viewer: "Usuario con acceso unicamente visual",
    };
    return descriptions[name] || "";
  }
}
