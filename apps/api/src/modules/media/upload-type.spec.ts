import * as sharp from "sharp";
import { detectUploadKind, rasterizeSvg } from "./upload-type";

const svgWithScript = Buffer.from(
  `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" onload="alert(1)"><script>alert(document.cookie)</script><rect width="120" height="60" fill="#2563eb"/></svg>`,
);

describe("detectUploadKind", () => {
  it("acepta imágenes reales aunque el cliente mienta en el nombre o mimetype", async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 4, background: "#ff0000" } }).png().toBuffer();
    const jpg = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#00ff00" } }).jpeg().toBuffer();
    expect(await detectUploadKind(png)).toBe("raster");
    expect(await detectUploadKind(jpg)).toBe("raster");
  });

  it("detecta SVG y PDF por su contenido", async () => {
    expect(await detectUploadKind(svgWithScript)).toBe("svg");
    expect(await detectUploadKind(Buffer.from("%PDF-1.7\n%âãÏÓ\n1 0 obj"))).toBe("pdf");
  });

  it("rechaza HTML, JavaScript y otros archivos", async () => {
    expect(await detectUploadKind(Buffer.from("<!doctype html><html><script>alert(1)</script></html>"))).toBeNull();
    expect(await detectUploadKind(Buffer.from("alert(document.cookie)"))).toBeNull();
    expect(await detectUploadKind(Buffer.from([0x4d, 0x5a, 0x90, 0x00]))).toBeNull(); // ejecutable
    expect(await detectUploadKind(Buffer.alloc(0))).toBeNull();
  });
});

describe("rasterizeSvg", () => {
  it("convierte el SVG a PNG: el resultado ya no contiene scripts", async () => {
    const out = await rasterizeSvg(svgWithScript);
    const meta = await sharp(out.buffer).metadata();
    expect(meta.format).toBe("png");
    expect(out.width).toBeGreaterThan(0);
    expect(out.buffer.toString("latin1")).not.toContain("<script");
  });
});
