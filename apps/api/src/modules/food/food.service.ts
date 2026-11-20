import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  ACTIVE_STATUSES,
  FOOD_STATUSES,
  FULFILLMENT_LABELS,
  FoodSettings,
  Fulfillment,
  PAYMENT_LABELS,
  PaymentMethod,
  firstImage,
  normalizeFoodSettings,
  normalizeProductExtras,
  openStatus,
} from "./food-settings";
import { starterFor } from "./food-starter";

const ORDER_INCLUDE = { items: { include: { product: { select: { id: true, name: true, images: true } } } } } as const;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const money = (n: number) => Math.round(n * 100) / 100;

function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);

  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  /* ------------------------------------------------------------------ */
  /* Restaurante                                                          */
  /* ------------------------------------------------------------------ */

  /** Todas las rutas del panel de Jeaz Food exigen que la empresa sea de ese producto. */
  async assertFood(tenantId: string) {
    if (!tenantId) throw new ForbiddenException("Selecciona una empresa");
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: { id: true, name: true, slug: true, logoUrl: true, product: true, settings: true },
    });
    if (!tenant) throw new NotFoundException("Empresa no encontrada");
    if (tenant.product !== "food") throw new ForbiddenException("Esta empresa no usa Jeaz Food");
    return tenant;
  }

  async getSettings(tenantId: string) {
    const tenant = await this.assertFood(tenantId);
    const settings = normalizeFoodSettings((tenant.settings as any)?.food);
    return {
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
      settings,
      status: openStatus(settings),
    };
  }

  async updateSettings(tenantId: string, body: any) {
    const tenant = await this.assertFood(tenantId);
    const current = (tenant.settings as any) || {};
    const food = normalizeFoodSettings({ ...(current.food || {}), ...(body?.settings || {}) });
    const data: any = { settings: { ...current, food } };

    const name = str(body?.name, 80);
    if (name) data.name = name;
    if (body?.logoUrl !== undefined) {
      const logo = str(body.logoUrl, 500);
      data.logoUrl = !logo || /^https?:\/\//i.test(logo) || logo.startsWith("/") ? logo || null : tenant.logoUrl;
    }
    if (body?.slug !== undefined) {
      const slug = slugify(str(body.slug, 60));
      if (slug.length < 3) throw new BadRequestException("El enlace del menú debe tener al menos 3 caracteres");
      if (slug !== tenant.slug) {
        const isTaken = async (candidate: string) =>
          !!(await this.prisma.tenant.findFirst({ where: { slug: candidate, NOT: { id: tenantId } }, select: { id: true } }));
        if (!(await isTaken(slug))) data.slug = slug;
        else if (body?.slugAuto === true) {
          // Bienvenida: si el nombre ya está en uso se toma la primera variante libre (nombre-2, nombre-3…).
          for (let i = 2; i <= 50 && !data.slug; i++) {
            if (!(await isTaken(`${slug}-${i}`))) data.slug = `${slug}-${i}`;
          }
        } else throw new BadRequestException("Ese enlace ya está en uso. Prueba con otro.");
      }
    }

    await this.prisma.tenant.update({ where: { id: tenantId }, data });
    return this.getSettings(tenantId);
  }

  /* ------------------------------------------------------------------ */
  /* Menú: categorías y platos                                            */
  /* ------------------------------------------------------------------ */

  private serializeProduct(p: any) {
    const extras = normalizeProductExtras(p.variants);
    return {
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      description: p.description || "",
      price: Number(p.price),
      comparePrice: p.comparePrice != null ? Number(p.comparePrice) : null,
      image: firstImage(p.images),
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      ...extras,
    };
  }

  async getMenu(tenantId: string) {
    await this.assertFood(tenantId);
    const [categories, products] = await Promise.all([
      this.prisma.productCategory.findMany({ where: { tenantId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      this.prisma.product.findMany({ where: { tenantId }, orderBy: [{ createdAt: "asc" }], take: 500 }),
    ]);
    return {
      categories: categories.map((c) => ({ id: c.id, name: c.name, sortOrder: c.sortOrder })),
      products: products.map((p) => this.serializeProduct(p)),
    };
  }

  private async uniqueCategorySlug(tenantId: string, name: string, exceptId?: string) {
    const base = slugify(name) || "categoria";
    let slug = base;
    for (let i = 2; ; i++) {
      const found = await this.prisma.productCategory.findFirst({
        where: { tenantId, slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
        select: { id: true },
      });
      if (!found) return slug;
      slug = `${base}-${i}`;
    }
  }

  async createCategory(tenantId: string, body: any) {
    await this.assertFood(tenantId);
    const name = str(body?.name, 60);
    if (!name) throw new BadRequestException("El nombre es obligatorio");
    const last = await this.prisma.productCategory.aggregate({ where: { tenantId }, _max: { sortOrder: true } });
    const c = await this.prisma.productCategory.create({
      data: { tenantId, name, slug: await this.uniqueCategorySlug(tenantId, name), sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
    return { id: c.id, name: c.name, sortOrder: c.sortOrder };
  }

  async updateCategory(tenantId: string, id: string, body: any) {
    await this.assertFood(tenantId);
    const cat = await this.prisma.productCategory.findFirst({ where: { id, tenantId } });
    if (!cat) throw new NotFoundException("Categoría no encontrada");
    const name = str(body?.name, 60);
    if (!name) throw new BadRequestException("El nombre es obligatorio");
    const c = await this.prisma.productCategory.update({
      where: { id },
      data: { name, slug: await this.uniqueCategorySlug(tenantId, name, id) },
    });
    return { id: c.id, name: c.name, sortOrder: c.sortOrder };
  }

  async deleteCategory(tenantId: string, id: string) {
    await this.assertFood(tenantId);
    const cat = await this.prisma.productCategory.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!cat) throw new NotFoundException("Categoría no encontrada");
    // Los platos quedan "sin categoría" (onDelete: SetNull); no se borran.
    await this.prisma.productCategory.delete({ where: { id } });
    return { deleted: true };
  }

  async reorderCategories(tenantId: string, ids: unknown) {
    await this.assertFood(tenantId);
    if (!Array.isArray(ids) || ids.length > 100) throw new BadRequestException("Orden inválido");
    const own = await this.prisma.productCategory.findMany({ where: { tenantId }, select: { id: true } });
    const ownIds = new Set(own.map((c) => c.id));
    const list = ids.map(String).filter((id) => ownIds.has(id));
    await this.prisma.$transaction(
      list.map((id, i) => this.prisma.productCategory.update({ where: { id }, data: { sortOrder: i } }))
    );
    return { ok: true };
  }

  private async productData(tenantId: string, body: any, partial: boolean) {
    const data: any = {};
    if (!partial || body?.name !== undefined) {
      const name = str(body?.name, 100);
      if (!name) throw new BadRequestException("El nombre es obligatorio");
      data.name = name;
    }
    if (!partial || body?.price !== undefined) {
      const price = Number(body?.price);
      if (!Number.isFinite(price) || price < 0 || price > 100000) throw new BadRequestException("Precio inválido");
      data.price = money(price);
    }
    if (body?.comparePrice !== undefined) {
      const cp = body.comparePrice === null || body.comparePrice === "" ? null : Number(body.comparePrice);
      data.comparePrice = cp === null || !Number.isFinite(cp) || cp <= 0 ? null : money(cp);
    }
    if (body?.description !== undefined) data.description = str(body.description, 600) || null;
    if (body?.image !== undefined) {
      const img = str(body.image, 500);
      data.images = img && (/^https?:\/\//i.test(img) || img.startsWith("/")) ? [img] : [];
    }
    if (body?.isActive !== undefined) data.isActive = Boolean(body.isActive);
    if (body?.isFeatured !== undefined) data.isFeatured = Boolean(body.isFeatured);
    if (body?.categoryId !== undefined) {
      if (!body.categoryId) data.categoryId = null;
      else {
        const cat = await this.prisma.productCategory.findFirst({ where: { id: String(body.categoryId), tenantId }, select: { id: true } });
        if (!cat) throw new BadRequestException("Categoría inválida");
        data.categoryId = cat.id;
      }
    }
    return data;
  }

  async createProduct(tenantId: string, body: any) {
    await this.assertFood(tenantId);
    const data = await this.productData(tenantId, body, false);
    data.variants = normalizeProductExtras(body) as any;
    const base = slugify(data.name) || "plato";
    let slug = base;
    for (let i = 2; await this.prisma.product.findFirst({ where: { tenantId, slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
    const p = await this.prisma.product.create({ data: { ...data, slug, tenantId, stock: 0 } });
    return this.serializeProduct(p);
  }

  async updateProduct(tenantId: string, id: string, body: any) {
    await this.assertFood(tenantId);
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException("Plato no encontrado");
    const data = await this.productData(tenantId, body, true);
    if (body?.optionGroups !== undefined || body?.tags !== undefined || body?.soldOut !== undefined) {
      const prev = normalizeProductExtras(existing.variants);
      data.variants = normalizeProductExtras({
        optionGroups: body.optionGroups ?? prev.optionGroups,
        tags: body.tags ?? prev.tags,
        soldOut: body.soldOut ?? prev.soldOut,
      }) as any;
    }
    const p = await this.prisma.product.update({ where: { id }, data });
    return this.serializeProduct(p);
  }

  /** Copia un plato (con sus opciones) para crear variantes en segundos. */
  async duplicateProduct(tenantId: string, id: string) {
    await this.assertFood(tenantId);
    const p = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!p) throw new NotFoundException("Plato no encontrado");
    const name = `${p.name} (copia)`.slice(0, 100);
    const base = slugify(name) || "plato";
    let slug = base;
    for (let i = 2; await this.prisma.product.findFirst({ where: { tenantId, slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
    const copy = await this.prisma.product.create({
      data: {
        tenantId,
        name,
        slug,
        categoryId: p.categoryId,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice,
        images: (p.images as any) ?? [],
        variants: { ...normalizeProductExtras(p.variants), soldOut: false } as any,
        isActive: p.isActive,
        isFeatured: false,
        stock: 0,
      },
    });
    return this.serializeProduct(copy);
  }

  /**
   * Carga un menú de ejemplo según el tipo de negocio. Solo si el menú está vacío,
   * para no mezclarse nunca con platos reales.
   */
  async loadStarterMenu(tenantId: string, type: unknown) {
    await this.assertFood(tenantId);
    const existing = await this.prisma.product.count({ where: { tenantId } });
    if (existing > 0) throw new BadRequestException("Tu menú ya tiene platos. El menú de ejemplo solo se carga en un menú vacío.");
    const starter = starterFor(String(type || ""));
    const last = await this.prisma.productCategory.aggregate({ where: { tenantId }, _max: { sortOrder: true } });
    let order = (last._max.sortOrder ?? -1) + 1;
    let n = 0;
    for (const section of starter) {
      const cat = await this.prisma.productCategory.create({
        data: { tenantId, name: section.category, slug: await this.uniqueCategorySlug(tenantId, section.category), sortOrder: order++ },
      });
      for (const item of section.products) {
        const base = slugify(item.name) || "plato";
        let slug = base;
        for (let i = 2; await this.prisma.product.findFirst({ where: { tenantId, slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
        await this.prisma.product.create({
          data: {
            tenantId,
            categoryId: cat.id,
            name: item.name,
            slug,
            description: item.description || null,
            price: item.price,
            isFeatured: !!item.featured,
            images: [],
            stock: 0,
            variants: normalizeProductExtras({ optionGroups: item.groups || [] }) as any,
          },
        });
        n++;
      }
    }
    return { created: { categories: starter.length, products: n }, ...(await this.getMenu(tenantId)) };
  }

  async deleteProduct(tenantId: string, id: string) {
    await this.assertFood(tenantId);
    const p = await this.prisma.product.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!p) throw new NotFoundException("Plato no encontrado");
    const used = await this.prisma.orderItem.count({ where: { productId: id } });
    if (used > 0) {
      // Borrarlo eliminaría también las líneas de pedidos anteriores: se oculta del menú.
      await this.prisma.product.update({ where: { id }, data: { isActive: false } });
      return { deleted: false, hidden: true };
    }
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  /* ------------------------------------------------------------------ */
  /* Pedidos                                                              */
  /* ------------------------------------------------------------------ */

  private serializeOrder(o: any) {
    return {
      id: o.id,
      number: o.orderNumber,
      status: o.status,
      fulfillment: o.fulfillment,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      deliveryAddress: o.deliveryAddress,
      notes: o.notes,
      paymentMethod: o.paymentMethod,
      paid: !!o.paidAt,
      subtotal: money(Number(o.totalAmount) - Number(o.deliveryFee || 0)),
      deliveryFee: Number(o.deliveryFee || 0),
      total: Number(o.totalAmount),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      items: (o.items || []).map((i: any) => ({
        id: i.id,
        productId: i.productId,
        name: i.product?.name || "Plato",
        image: firstImage(i.product?.images),
        quantity: i.quantity,
        price: Number(i.price),
        total: Number(i.total),
        options: Array.isArray(i.options) ? i.options : [],
        notes: i.notes || "",
      })),
    };
  }

  async listOrders(tenantId: string, query: { scope?: string; status?: string; search?: string }) {
    await this.assertFood(tenantId);
    const where: any = { tenantId, source: "food" };
    if (query.status && FOOD_STATUSES.includes(query.status)) where.status = query.status;
    else if (query.scope === "active") where.status = { in: ACTIVE_STATUSES };
    else if (query.scope === "history") where.status = { in: ["delivered", "cancelled"] };
    const search = str(query.search, 60);
    if (search) {
      const n = Number(search.replace("#", ""));
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        ...(Number.isInteger(n) && n > 0 ? [{ orderNumber: n }] : []),
      ];
    }
    const orders = await this.prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { createdAt: query.scope === "active" ? "asc" : "desc" },
      take: query.scope === "active" ? 200 : 100,
    });
    return orders.map((o) => this.serializeOrder(o));
  }

  async getOrder(tenantId: string, id: string) {
    await this.assertFood(tenantId);
    const o = await this.prisma.order.findFirst({ where: { id, tenantId, source: "food" }, include: ORDER_INCLUDE });
    if (!o) throw new NotFoundException("Pedido no encontrado");
    return this.serializeOrder(o);
  }

  async updateOrder(tenantId: string, id: string, body: any) {
    await this.assertFood(tenantId);
    const o = await this.prisma.order.findFirst({ where: { id, tenantId, source: "food" }, select: { id: true, paidAt: true } });
    if (!o) throw new NotFoundException("Pedido no encontrado");
    const data: any = {};
    if (body?.status !== undefined) {
      if (!FOOD_STATUSES.includes(body.status)) throw new BadRequestException("Estado inválido");
      data.status = body.status;
    }
    if (body?.paid !== undefined) data.paidAt = body.paid ? o.paidAt || new Date() : null;
    const updated = await this.prisma.order.update({ where: { id }, data, include: ORDER_INCLUDE });
    return this.serializeOrder(updated);
  }

  /* ------------------------------------------------------------------ */
  /* Inicio del panel                                                     */
  /* ------------------------------------------------------------------ */

  async overview(tenantId: string) {
    const tenant = await this.assertFood(tenantId);
    const settings = normalizeFoodSettings((tenant.settings as any)?.food);

    // "Hoy" según la zona horaria del restaurante.
    const now = new Date();
    const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timezone }).format(now); // YYYY-MM-DD
    const offsetMs = (() => {
      const asLocal = new Date(now.toLocaleString("en-US", { timeZone: settings.timezone }));
      return asLocal.getTime() - now.getTime();
    })();
    const startOfToday = new Date(new Date(`${localDate}T00:00:00Z`).getTime() - offsetMs);
    const since = new Date(startOfToday.getTime() - 13 * 86400000);

    const [orders, activeCount, productCount, categoryCount] = await Promise.all([
      this.prisma.order.findMany({
        where: { tenantId, source: "food", createdAt: { gte: since } },
        include: { items: { select: { productId: true, quantity: true, total: true, product: { select: { name: true, images: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 3000,
      }),
      this.prisma.order.count({ where: { tenantId, source: "food", status: { in: ACTIVE_STATUSES } } }),
      this.prisma.product.count({ where: { tenantId, isActive: true } }),
      this.prisma.productCategory.count({ where: { tenantId } }),
    ]);

    const valid = orders.filter((o) => o.status !== "cancelled");
    const today = valid.filter((o) => o.createdAt >= startOfToday);
    const sum = (list: typeof valid) => money(list.reduce((s, o) => s + Number(o.totalAmount), 0));
    const prevWeekStart = new Date(startOfToday.getTime() - 13 * 86400000);
    const weekStart = new Date(startOfToday.getTime() - 6 * 86400000);
    const week = valid.filter((o) => o.createdAt >= weekStart);
    const prevWeek = valid.filter((o) => o.createdAt >= prevWeekStart && o.createdAt < weekStart);

    const days = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(weekStart.getTime() + i * 86400000);
      const end = new Date(start.getTime() + 86400000);
      const list = valid.filter((o) => o.createdAt >= start && o.createdAt < end);
      return { date: new Date(start.getTime() + offsetMs).toISOString().slice(0, 10), orders: list.length, revenue: sum(list) };
    });

    const top = new Map<string, { name: string; image: string; quantity: number; revenue: number }>();
    for (const o of week) {
      for (const i of o.items) {
        const t = top.get(i.productId) || { name: i.product?.name || "Plato", image: firstImage(i.product?.images), quantity: 0, revenue: 0 };
        t.quantity += i.quantity;
        t.revenue = money(t.revenue + Number(i.total));
        top.set(i.productId, t);
      }
    }

    const byFulfillment: Record<string, number> = {};
    for (const o of week) byFulfillment[o.fulfillment || "pickup"] = (byFulfillment[o.fulfillment || "pickup"] || 0) + 1;

    const recent = await this.prisma.order.findMany({
      where: { tenantId, source: "food" },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 6,
    });

    return {
      restaurant: { name: tenant.name, slug: tenant.slug, logoUrl: tenant.logoUrl, status: openStatus(settings), acceptingOrders: settings.acceptingOrders },
      currencySymbol: settings.currencySymbol,
      today: { orders: today.length, revenue: sum(today), avgTicket: today.length ? money(sum(today) / today.length) : 0 },
      week: { orders: week.length, revenue: sum(week), prevRevenue: sum(prevWeek), prevOrders: prevWeek.length },
      activeOrders: activeCount,
      days,
      topProducts: [...top.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
      byFulfillment,
      recentOrders: recent.map((o) => this.serializeOrder(o)),
      setup: {
        hasCategories: categoryCount > 0,
        hasProducts: productCount > 0,
        hasWhatsapp: !!settings.whatsapp,
        hasLogo: !!tenant.logoUrl,
        hasAddress: !!settings.address,
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /* Menú público                                                         */
  /* ------------------------------------------------------------------ */

  private async publicTenant(slug: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: str(slug, 80).toLowerCase(), product: "food", isActive: true, deletedAt: null },
      select: { id: true, name: true, slug: true, logoUrl: true, settings: true, subscriptionEndsAt: true },
    });
    if (!tenant) throw new NotFoundException("Menú no encontrado");
    return { tenant, settings: normalizeFoodSettings((tenant.settings as any)?.food) };
  }

  async publicMenu(slug: string) {
    const { tenant, settings } = await this.publicTenant(slug);
    const [categories, products] = await Promise.all([
      this.prisma.productCategory.findMany({ where: { tenantId: tenant.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
      this.prisma.product.findMany({ where: { tenantId: tenant.id, isActive: true }, orderBy: { createdAt: "asc" }, take: 500 }),
    ]);
    const items = products.map((p) => {
      const { isActive, ...rest } = this.serializeProduct(p);
      return rest;
    });
    const sections = categories
      .map((c) => ({ id: c.id, name: c.name, products: items.filter((p) => p.categoryId === c.id) }))
      .filter((c) => c.products.length);
    const loose = items.filter((p) => !p.categoryId || !categories.some((c) => c.id === p.categoryId));
    if (loose.length) sections.push({ id: "otros", name: "Otros", products: loose });

    const status = openStatus(settings);
    const { timezone, ...publicSettings } = settings;
    return {
      restaurant: {
        name: tenant.name,
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        ...publicSettings,
        isOpen: status.isOpen,
        statusLabel: status.label,
        canOrder: settings.acceptingOrders && (status.isOpen || settings.ordersWhenClosed),
      },
      categories: sections,
    };
  }

  async createPublicOrder(slug: string, body: any) {
    const { tenant, settings } = await this.publicTenant(slug);
    const status = openStatus(settings);
    if (!settings.acceptingOrders) throw new BadRequestException("El restaurante no está recibiendo pedidos en este momento.");
    if (!status.isOpen && !settings.ordersWhenClosed) throw new BadRequestException(`${status.label}. Vuelve a intentarlo en horario de atención.`);

    const customerName = str(body?.customerName, 80);
    const customerPhone = str(body?.customerPhone, 30);
    if (!customerName) throw new BadRequestException("Escribe tu nombre");
    if (customerPhone.replace(/\D/g, "").length < 7) throw new BadRequestException("Escribe un teléfono válido");

    const fulfillment = String(body?.fulfillment || "") as Fulfillment;
    const allowed: Record<Fulfillment, boolean> = {
      delivery: settings.delivery.enabled,
      pickup: settings.pickup.enabled,
      dine_in: settings.dineIn.enabled,
    };
    if (!allowed[fulfillment]) throw new BadRequestException("Elige cómo quieres recibir tu pedido");
    const address = str(body?.address, 300);
    if (fulfillment === "delivery" && address.length < 5) throw new BadRequestException("Escribe la dirección de entrega");
    // En el local: número o nombre de mesa (llega del QR de la mesa o lo escribe el cliente).
    const table = str(body?.table, 12).replace(/[^\p{L}\p{N} -]/gu, "");

    const paymentMethod = String(body?.paymentMethod || "") as PaymentMethod;
    if (!settings.paymentMethods.includes(paymentMethod)) throw new BadRequestException("Elige un método de pago");

    const itemsRaw = Array.isArray(body?.items) ? body.items : [];
    if (!itemsRaw.length || itemsRaw.length > 50) throw new BadRequestException("Tu pedido está vacío");

    const productIds = [...new Set(itemsRaw.map((i: any) => String(i?.productId || "")))] as string[];
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds }, tenantId: tenant.id, isActive: true } });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const lines: Array<{ productId: string; name: string; quantity: number; price: number; total: number; options: any[]; notes: string }> = [];
    for (const raw of itemsRaw) {
      const product = byId.get(String(raw?.productId || ""));
      if (!product) throw new BadRequestException("Uno de los platos ya no está disponible. Actualiza el menú.");
      const extras = normalizeProductExtras(product.variants);
      if (extras.soldOut) throw new BadRequestException(`${product.name} está agotado por hoy`);
      const quantity = Math.floor(Number(raw?.quantity) || 0);
      if (quantity < 1 || quantity > 99) throw new BadRequestException("Cantidad inválida");

      const chosen = new Map<string, string[]>();
      for (const sel of Array.isArray(raw?.options) ? raw.options : []) {
        chosen.set(String(sel?.groupId || ""), (Array.isArray(sel?.optionIds) ? sel.optionIds : []).map(String));
      }
      const options: Array<{ group: string; name: string; price: number }> = [];
      let unit = Number(product.price);
      for (const group of extras.optionGroups) {
        const ids = [...new Set(chosen.get(group.id) || [])];
        const picked = group.options.filter((o) => ids.includes(o.id));
        if (picked.length !== ids.length) throw new BadRequestException(`Opción inválida en ${product.name}`);
        if (picked.length > group.max) throw new BadRequestException(`En "${group.name}" puedes elegir hasta ${group.max}`);
        if (group.required && picked.length === 0) throw new BadRequestException(`Elige "${group.name}" para ${product.name}`);
        for (const o of picked) {
          unit += o.price;
          options.push({ group: group.name, name: o.name, price: o.price });
        }
      }
      unit = money(unit);
      const total = money(unit * quantity);
      subtotal = money(subtotal + total);
      lines.push({ productId: product.id, name: product.name, quantity, price: unit, total, options, notes: str(raw?.notes, 180) });
    }

    if (fulfillment === "delivery" && settings.delivery.minOrder > 0 && subtotal < settings.delivery.minOrder) {
      throw new BadRequestException(`El pedido mínimo para delivery es ${settings.currencySymbol}${settings.delivery.minOrder.toFixed(2)}`);
    }
    const deliveryFee = fulfillment === "delivery" ? settings.delivery.fee : 0;
    const total = money(subtotal + deliveryFee);
    const notes = str(body?.notes, 400);

    const order = await this.prisma.$transaction(async (tx) => {
      const last = await tx.order.aggregate({ where: { tenantId: tenant.id, source: "food" }, _max: { orderNumber: true } });
      return tx.order.create({
        data: {
          tenantId: tenant.id,
          source: "food",
          orderNumber: (last._max.orderNumber ?? 0) + 1,
          status: "pending",
          fulfillment,
          deliveryAddress: fulfillment === "delivery" ? address : fulfillment === "dine_in" && table ? `Mesa ${table}` : null,
          deliveryFee,
          totalAmount: total,
          currency: settings.currency,
          customerName,
          customerPhone,
          notes: notes || null,
          paymentMethod,
          items: {
            create: lines.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              price: l.price,
              total: l.total,
              options: l.options as any,
              notes: l.notes || null,
            })),
          },
        },
      });
    });

    const sym = settings.currencySymbol;
    const fmt = (n: number) => `${sym}${n.toFixed(2)}`;
    this.notifications
      .sendPushNotificationToTenant(tenant.id, `Nuevo pedido #${order.orderNumber}`, `${customerName} · ${fmt(total)} · ${FULFILLMENT_LABELS[fulfillment]}`, {
        type: "food_order",
        orderId: order.id,
      })
      .catch((err: any) => this.logger.warn(`Push de pedido falló: ${err?.message || err}`));

    // Mensaje listo para enviar por WhatsApp al restaurante.
    const message = [
      `*Pedido #${order.orderNumber}* · ${tenant.name}`,
      "",
      ...lines.map((l) => {
        const opts = l.options.map((o) => `   + ${o.name}${o.price ? ` (${fmt(o.price)})` : ""}`);
        return [`${l.quantity}x ${l.name} — ${fmt(l.total)}`, ...opts, ...(l.notes ? [`   _${l.notes}_`] : [])].join("\n");
      }),
      "",
      `Subtotal: ${fmt(subtotal)}`,
      ...(fulfillment === "delivery" ? [`Envío: ${deliveryFee ? fmt(deliveryFee) : "por confirmar"}`] : []),
      `*Total: ${fmt(total)}*`,
      "",
      `👤 ${customerName} · ${customerPhone}`,
      `🛵 ${FULFILLMENT_LABELS[fulfillment]}${fulfillment === "delivery" ? `: ${address}` : fulfillment === "dine_in" && table ? ` · Mesa ${table}` : ""}`,
      `💳 ${PAYMENT_LABELS[paymentMethod]}`,
      ...(notes ? [`📝 ${notes}`] : []),
    ].join("\n");

    return {
      id: order.id,
      number: order.orderNumber,
      total,
      whatsappUrl: settings.whatsapp ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}` : null,
    };
  }

  /** Seguimiento público del pedido (el id es un UUID imposible de adivinar). */
  async publicOrderStatus(slug: string, id: string) {
    const { tenant } = await this.publicTenant(slug);
    const o = await this.prisma.order.findFirst({
      where: { id: str(id, 40), tenantId: tenant.id, source: "food" },
      select: { orderNumber: true, status: true, fulfillment: true, totalAmount: true, createdAt: true, updatedAt: true },
    });
    if (!o) throw new NotFoundException("Pedido no encontrado");
    return { number: o.orderNumber, status: o.status, fulfillment: o.fulfillment, total: Number(o.totalAmount), createdAt: o.createdAt, updatedAt: o.updatedAt };
  }
}
