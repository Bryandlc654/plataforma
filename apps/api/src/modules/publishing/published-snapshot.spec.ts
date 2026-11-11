import { buildSnapshot, hasUnpublishedChanges, snapshotPages } from "./published-snapshot";
import { PublishingService } from "./publishing.service";

const livePages = () => [
  {
    id: "p1", name: "Inicio", slug: "home", path: "/", isDefault: true, seoTitle: null, seoDesc: null, sortOrder: 0, isPublished: false,
    createdAt: new Date(), updatedAt: new Date(),
    blocks: [
      { id: "b2", type: "cta", content: { title: "Llámanos" }, styles: null, sortOrder: 1 },
      { id: "b1", type: "hero", content: { title: "Hola", subtitle: "Bienvenidos" }, styles: null, sortOrder: 0 },
    ],
  },
];

describe("published-snapshot", () => {
  it("copia páginas y bloques ordenados, sin fechas", () => {
    const snap = buildSnapshot(livePages(), new Date("2026-11-11T00:00:00Z"));
    expect(snap.publishedAt).toBe("2026-11-11T00:00:00.000Z");
    expect(snap.pages[0].blocks.map((b) => b.id)).toEqual(["b1", "b2"]);
    expect((snap.pages[0] as any).createdAt).toBeUndefined();
  });

  it("la copia no cambia si después se edita el borrador", () => {
    const live = livePages();
    const snap = buildSnapshot(live);
    live[0].blocks[1].content.title = "Editado sin publicar";
    expect(snapshotPages(snap)[0].blocks[0].content.title).toBe("Hola");
  });

  it("detecta cambios sin publicar, sin importar el orden de las claves (MySQL las reordena)", () => {
    const snap = buildSnapshot(livePages());
    const reordered = livePages();
    reordered[0].blocks[1].content = { subtitle: "Bienvenidos", title: "Hola" } as any;
    expect(hasUnpublishedChanges(snap, reordered)).toBe(false);

    const edited = livePages();
    edited[0].blocks[1].content.title = "Nuevo título";
    expect(hasUnpublishedChanges(snap, edited)).toBe(true);
    expect(hasUnpublishedChanges(null, livePages())).toBe(true);
  });
});

describe("PublishingService con copia publicada", () => {
  function setup(site: any) {
    const prisma: any = {
      site: {
        findFirst: jest.fn().mockResolvedValue(site),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      sitePage: { findMany: jest.fn().mockResolvedValue(livePages()) },
    };
    const service: any = new PublishingService(prisma, { get: () => undefined } as any);
    return { service, prisma };
  }

  it("publicar guarda la copia del borrador", async () => {
    const { service, prisma } = setup({ id: "s1", subdomain: "demo", tenant: { subdomain: "demo" } });
    await service.publish("s1", "t1");
    const data = prisma.site.update.mock.calls[0][0].data;
    expect(data.isPublished).toBe(true);
    expect(data.publishedSnapshot.pages[0].blocks.map((b: any) => b.id)).toEqual(["b1", "b2"]);
  });

  it("el público ve la copia, no el borrador", async () => {
    const snap = buildSnapshot(livePages());
    const { service, prisma } = setup({ id: "s1", isPublished: true, publishedSnapshot: snap });
    const pages = await service.publicPagesOf({ id: "s1", isPublished: true, publishedSnapshot: snap });
    expect(pages[0].blocks[0].content.title).toBe("Hola");
    expect(prisma.sitePage.findMany).not.toHaveBeenCalled();
  });

  it("un sitio publicado antes del cambio congela lo que ya mostraba (sin cambiar nada para el público)", async () => {
    const { service, prisma } = setup({});
    const pages = await service.publicPagesOf({ id: "s1", isPublished: true, publishedSnapshot: null });
    expect(pages[0].blocks.length).toBe(2);
    const call = prisma.site.updateMany.mock.calls[0][0];
    expect(call.where.id).toBe("s1");
    expect(call.data.publishedSnapshot.pages.length).toBe(1);
  });

  it("un sitio nunca publicado no guarda copia al previsualizarse", async () => {
    const { service, prisma } = setup({});
    await service.publicPagesOf({ id: "s1", isPublished: false, publishedSnapshot: null });
    expect(prisma.site.updateMany).not.toHaveBeenCalled();
  });
});
