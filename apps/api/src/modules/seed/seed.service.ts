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
          logoText: "URBAN NOIR",
          links: [
            { label: "Inicio", url: "/" },
            { label: "Hombres", url: "#hombres" },
            { label: "Mujeres", url: "#mujeres" },
            { label: "Ofertas", url: "#ofertas" },
          ],
          ctaText: "Suscribirse",
          ctaUrl: "#newsletter",
        },
        styles: { sticky: true },
      },
      {
        type: "hero",
        sortOrder: 1,
        content: {
          kicker: "STREETWEAR · ECOMMERCE",
          title: "Redefine tu calle",
          subtitle:
            "Una coleccion con una sola regla: estetica por encima del ruido. Bordado, corte y tela que hablan por si solos.",
          buttonText: "Comprar Ahora",
          buttonUrl: "#productos",
          secondaryButtonText: "Ver el catalogo",
          secondaryButtonUrl: "#categorias",
          primaryColor: "#F1F1F1",
          secondaryColor: "#0A0A0B",
          image:
            "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1600&q=80",
        },
        styles: { height: "80vh" },
      },
      {
        type: "image",
        sortOrder: 2,
        content: {
          title: "Hombres",
          subtitle: "Corte recto, telas pesadas y detalles de taller",
          image:
            "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&q=80",
          buttonText: "Ver productos",
          buttonUrl: "#hombres",
          link: "#hombres",
        },
      },
      {
        type: "image",
        sortOrder: 3,
        content: {
          title: "Mujeres",
          subtitle: "Siluetas limpias con actitud de calle",
          image:
            "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&q=80",
          buttonText: "Ver productos",
          buttonUrl: "#mujeres",
          link: "#mujeres",
        },
      },
      {
        type: "features",
        sortOrder: 4,
        content: {
          title: "El drop de la temporada",
          subtitle: "Piezas en edicion limitada. Cuando se acaban, se acaban.",
          items: [
            { icon: "truck", title: "Envio en 24h", desc: "Gratis en pedidos superiores a $50" },
            { icon: "shield", title: "Pago seguro", desc: "Checkout cifrado y multiples medios" },
            { icon: "rotate", title: "Devolucion facil", desc: "30 dias sin preguntas" },
          ],
        },
      },
      {
        type: "cta",
        sortOrder: 5,
        content: {
          kicker: "FLASH SALE",
          title: "50% de descuento en tu primera compra",
          subtitle: "Usa el codigo NOIR24 antes de que termine el dia.",
          buttonText: "Suscribirme y comprar",
          buttonUrl: "#oferta",
          accent: "#F1F1F1",
        },
      },
      {
        type: "footer",
        sortOrder: 6,
        content: {
          companyName: "URBAN NOIR",
          description: "Ropa urbana hecha para durar. Disenada en la ciudad, bordada a mano.",
          columns: [
            { title: "Tienda", links: [{ label: "Hombres", url: "#" }, { label: "Mujeres", url: "#" }, { label: "Ofertas", url: "#" }] },
            { title: "Ayuda", links: [{ label: "Envios", url: "#" }, { label: "Devoluciones", url: "#" }, { label: "Tallas", url: "#" }] },
            { title: "Legal", links: [{ label: "Privacidad", url: "#" }, { label: "Terminos", url: "#" }] },
          ],
          social: [
            { label: "Instagram", url: "#" },
            { label: "Twitter", url: "#" },
            { label: "WhatsApp", url: "#" },
          ],
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
