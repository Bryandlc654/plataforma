import { applyCatalogToContent, selectCatalogProducts } from "@plataforma/shared";
import { PublishingService } from "./publishing.service";

const P = (id: string, extra: Record<string, any> = {}) => ({
  id, name: `Producto ${id}`, price: "10.00", comparePrice: null, images: [`https://img/${id}.jpg`],
  isActive: true, isFeatured: false, stock: 5, categoryId: "cat-a", createdAt: new Date(2026, 0, Number(id.replace(/\D/g, "")) || 1),
  ...extra,
});
const products = [
  P("p1", { price: "30.00" }),
  P("p2", { price: "5.00", isFeatured: true, categoryId: "cat-b" }),
  P("p3", { price: "20.00", stock: 0 }),
  P("p4", { price: "15.00", comparePrice: "20.00", isActive: false }),
];

describe("selectCatalogProducts", () => {
  it("por defecto: activos, destacados primero, luego los más nuevos", () => {
    expect(selectCatalogProducts(products as any, {}).map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
  });
  it("filtra por categoría, destacados y agotados", () => {
    expect(selectCatalogProducts(products as any, { catalogCategory: "cat-a" }).map((p) => p.id)).toEqual(["p3", "p1"]);
    expect(selectCatalogProducts(products as any, { catalogCategory: "featured" }).map((p) => p.id)).toEqual(["p2"]);
    expect(selectCatalogProducts(products as any, { hideSoldOut: "true" }).map((p) => p.id)).not.toContain("p3");
  });
  it("ordena por precio y limita la cantidad", () => {
    expect(selectCatalogProducts(products as any, { catalogSort: "price-asc" }).map((p) => p.id)).toEqual(["p2", "p3", "p1"]);
    expect(selectCatalogProducts(products as any, { catalogSort: "price-desc", catalogLimit: "2" }).map((p) => p.id)).toEqual(["p1", "p3"]);
  });
});

describe("applyCatalogToContent", () => {
  const section = { variant: "urban-noir", items: [{ id: "manual", title: "A mano" }] };
  it("en vivo: los elementos son los productos de la tienda (mismo id para el carrito)", () => {
    const out = applyCatalogToContent("portfolio", section, products as any);
    expect(out.items.map((i: any) => i.id)).toEqual(["p2", "p3", "p1"]);
    expect(out.items[0]).toMatchObject({ title: "Producto p2", price: "5.00", image: "https://img/p2.jpg", tag: "Nuevo" });
  });
  it("muestra la oferta como etiqueta y precio anterior", () => {
    const out = applyCatalogToContent("portfolio", section, [P("p9", { price: "15.00", comparePrice: "20.00" })] as any);
    expect(out.items[0]).toMatchObject({ price: "15.00", compareAt: "20.00", tag: "-25%" });
  });
  it("elegidos a mano: no cambia la lista", () => {
    const manual = { ...section, source: "manual" };
    expect(applyCatalogToContent("portfolio", manual, products as any)).toBe(manual);
  });
  it("sin productos en la tienda: se mantiene la lista a mano (salvo que se exija el catálogo)", () => {
    expect(applyCatalogToContent("portfolio", section, []).items[0].id).toBe("manual");
    expect(applyCatalogToContent("portfolio", { ...section, source: "catalog" }, []).items).toEqual([]);
  });
  it("otras plantillas o secciones no se tocan", () => {
    const other = { variant: "indigo", items: [] };
    expect(applyCatalogToContent("portfolio", other, products as any)).toBe(other);
  });
});

describe("PublishingService.hydrateCatalogProducts", () => {
  it("llena las secciones en vivo con los productos de la tienda según sus opciones", async () => {
    const prisma: any = { product: { findMany: jest.fn().mockResolvedValue(products) } };
    const service: any = new PublishingService(prisma, { get: () => undefined } as any);
    const blocks = [
      { type: "portfolio", content: { variant: "urban-noir", catalogCategory: "featured" } },
      { type: "portfolio", content: { variant: "urban-noir", source: "manual", items: [{ id: "x" }] } },
    ];
    const out = await service.hydrateCatalogProducts(blocks, { tenantId: "t1" });
    expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId: "t1", isActive: true } }));
    expect(out[0].content.items.map((i: any) => i.id)).toEqual(["p2"]);
    expect(out[1].content.items).toEqual([{ id: "x" }]);
  });

  it("no consulta la base si no hay secciones en vivo", async () => {
    const prisma: any = { product: { findMany: jest.fn() } };
    const service: any = new PublishingService(prisma, { get: () => undefined } as any);
    await service.hydrateCatalogProducts([{ type: "hero", content: { variant: "urban-noir" } }], { tenantId: "t1" });
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });
});
