import { PublishingService } from "./publishing.service";

/** La caché de páginas valida la versión del sitio: otra instancia pudo publicar. */
describe("PublishingService caché validada por versión", () => {
  function setup(version: { updatedAt: Date; publishedAt: Date; isPublished: boolean }) {
    const prisma: any = { site: { findFirst: jest.fn().mockResolvedValue({ id: "s1", ...version }) } };
    const service: any = new PublishingService(prisma, { get: () => undefined } as any);
    return { service, prisma };
  }
  const v1 = { updatedAt: new Date(1000), publishedAt: new Date(1000), isPublished: true };

  it("sirve la caché si la versión del sitio no cambió", async () => {
    const { service } = setup(v1);
    service.htmlCache.set("demo:/", { value: "<html>v1</html>", expiry: Date.now() + 60_000, version: service.siteVersionOf({ id: "s1", ...v1 }) });
    const out = await service.getPublicHtml("demo", "/");
    expect(out).toEqual({ html: "<html>v1</html>", status: 200 });
  });

  it("descarta la caché si otra instancia publicó (cambió publishedAt)", async () => {
    const { service, prisma } = setup({ ...v1, publishedAt: new Date(2000), updatedAt: new Date(2000) });
    service.htmlCache.set("demo:/", { value: "<html>v1</html>", expiry: Date.now() + 60_000, version: service.siteVersionOf({ id: "s1", ...v1 }) });
    // Tras descartar, vuelve a dibujar: la consulta completa del sitio usa findFirst otra vez.
    prisma.site.findFirst.mockResolvedValueOnce({ id: "s1", ...v1, publishedAt: new Date(2000) }).mockResolvedValueOnce(null);
    await service.getPublicHtml("demo", "/").catch(() => undefined);
    expect(service.htmlCache.has("demo:/")).toBe(false);
    expect(prisma.site.findFirst).toHaveBeenCalledTimes(2);
  });
});
