import { SitesService } from "./sites.service";

function setup(opts: { template?: any; storeBlock?: boolean; products?: number; orders?: number }) {
  const prisma: any = {
    site: { findMany: jest.fn().mockResolvedValue(opts.template ? [{ template: opts.template }] : [{ template: null }]) },
    pageBlock: { findFirst: jest.fn().mockResolvedValue(opts.storeBlock ? { id: "b1" } : null) },
    product: { count: jest.fn().mockResolvedValue(opts.products || 0) },
    order: { count: jest.fn().mockResolvedValue(opts.orders || 0) },
  };
  return { service: new SitesService(prisma, {} as any), prisma };
}

const plain = { name: "Mi web", description: "Sitio institucional", tags: [], category: { slug: "negocios" } };

describe("SitesService.getCapabilities (detección de tienda)", () => {
  it("plantilla clasificada como e-commerce → tienda (sin consultar secciones)", async () => {
    const { service, prisma } = setup({ template: { name: "URBAN NOIR", description: "", tags: ["ecommerce"], category: { slug: "ecommerce" } } });
    expect((await service.getCapabilities("t1")).ecommerce).toBe(true);
    expect(prisma.pageBlock.findFirst).not.toHaveBeenCalled();
  });

  it("plantilla renombrada o recategorizada, pero con secciones de tienda → sigue siendo tienda", async () => {
    const { service, prisma } = setup({ template: plain, storeBlock: true });
    expect((await service.getCapabilities("t1")).ecommerce).toBe(true);
    const where = prisma.pageBlock.findFirst.mock.calls[0][0].where;
    expect(where.page).toEqual({ site: { tenantId: "t1", deletedAt: null } });
    expect(where.OR).toEqual(expect.arrayContaining([
      { type: "checkout" },
      { type: "portfolio", content: { path: "$.variant", equals: "urban-noir" } },
    ]));
    expect(prisma.product.count).not.toHaveBeenCalled();
  });

  it("sin plantilla de tienda ni secciones, pero con productos → tienda", async () => {
    const { service } = setup({ template: plain, products: 3 });
    expect((await service.getCapabilities("t1")).ecommerce).toBe(true);
  });

  it("sitio institucional sin nada de tienda → no es tienda", async () => {
    const { service } = setup({ template: plain });
    expect((await service.getCapabilities("t1")).ecommerce).toBe(false);
  });
});
