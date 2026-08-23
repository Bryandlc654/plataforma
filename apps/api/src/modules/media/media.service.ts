import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuid } from "uuid";
import * as sharp from "sharp";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

@Injectable()
export class MediaService {
  private storagePath: string;
  private s3Client: S3Client | null = null;
  private isR2Enabled = false;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    this.storagePath = this.configService.get<string>("storage.path", "./uploads");
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }

    const r2AccountIdRaw = process.env.R2_ACCOUNT_ID;
    const r2AccessKey = process.env.R2_ACCESS_KEY_ID;
    const r2SecretKey = process.env.R2_SECRET_ACCESS_KEY;

    if (r2AccountIdRaw && r2AccessKey && r2SecretKey) {
      this.isR2Enabled = true;
      let endpoint = `https://${r2AccountIdRaw}.r2.cloudflarestorage.com`;
      if (r2AccountIdRaw.startsWith("http")) {
        endpoint = r2AccountIdRaw;
      } else if (r2AccountIdRaw.includes(".r2.cloudflarestorage.com")) {
        endpoint = `https://${r2AccountIdRaw}`;
      }
      this.s3Client = new S3Client({
        region: "auto",
        endpoint,
        credentials: { accessKeyId: r2AccessKey, secretAccessKey: r2SecretKey },
      });
    }
  }

  async upload(tenantId: string, file: Express.Multer.File, folder?: string) {
    if (!file) throw new BadRequestException("No file provided");

    const ext = path.extname(file.originalname);
    const cleanFolder = folder && folder !== "/" ? folder.replace(/^\/+|\/+$/g, "") : "";
    let finalBuffer = file.buffer;
    let mimeType = file.mimetype;
    let storedExt = ext;
    let width: number | null = null;
    let height: number | null = null;

    if (file.mimetype.startsWith("image/") && !file.mimetype.includes("svg")) {
      try {
        const image = sharp(file.buffer);
        const metadata = await image.metadata();
        width = metadata.width || null;
        height = metadata.height || null;
        const resizeTo = metadata.width && metadata.width > 1920 ? 1920 : undefined;
        if (metadata.hasAlpha) {
          finalBuffer = await image.resize(resizeTo).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
          mimeType = "image/png";
          storedExt = ".png";
        } else {
          finalBuffer = await image.resize(resizeTo).jpeg({ quality: 85 }).toBuffer();
          mimeType = "image/jpeg";
          storedExt = ".jpg";
        }
      } catch {
        finalBuffer = file.buffer;
      }
    }

    const storedName = `${uuid()}${storedExt}`;
    const fileSize = finalBuffer.length;

    let fileUrl = "";

    if (this.isR2Enabled && this.s3Client) {
      const bucket = process.env.R2_BUCKET_NAME;
      if (!bucket) throw new BadRequestException("R2_BUCKET_NAME is not configured");
      const objectKey = cleanFolder ? `${tenantId}/${cleanFolder}/${storedName}` : `${tenantId}/${storedName}`;
      try {
        await this.s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: finalBuffer, ContentType: mimeType }));
      } catch (err: any) {
        throw new BadRequestException(`Cloudflare R2 Error: No se pudo subir el archivo. Detalle: ${err.message || err.name}`);
      }
      const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
      fileUrl = publicUrlBase ? `${publicUrlBase}/${objectKey}` : `https://${bucket}.r2.cloudflarestorage.com/${objectKey}`;
    } else {
      const uploadDir = cleanFolder ? path.join(this.storagePath, tenantId, cleanFolder) : path.join(this.storagePath, tenantId);
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, storedName);
      fs.writeFileSync(filePath, finalBuffer);
      fileUrl = cleanFolder ? `/uploads/${tenantId}/${cleanFolder}/${storedName}` : `/uploads/${tenantId}/${storedName}`;
    }

    const media = await this.prisma.$transaction([
      this.prisma.media.create({
        data: {
          tenantId, originalName: file.originalname, storedName, mimeType,
          size: BigInt(fileSize), url: fileUrl, width: width || undefined,
          height: height || undefined, folder: cleanFolder || "/",
        },
      }),
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { storageUsed: { increment: fileSize } },
      }),
    ]);

    return { ...media[0], url: this.toAbsoluteUrl(media[0].url) };
  }

  private toAbsoluteUrl(url: string): string {
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const base = process.env.PUBLIC_API_URL || process.env.API_URL || "";
    if (!base) return url;
    return `${base}${url}`;
  }

  async findAll(tenantId: string, folder?: string, type?: string, page = 1, limit = 30) {
    const where: any = { tenantId };
    if (folder) where.folder = folder;
    if (type) where.mimeType = { startsWith: type };

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const skip = (page - 1) * safeLimit;

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: safeLimit,
        select: {
          id: true, originalName: true, mimeType: true, size: true,
          url: true, width: true, height: true, folder: true, alt: true,
          createdAt: true,
        },
      }),
      this.prisma.media.count({ where }),
    ]);

    return {
      data: data.map(m => ({ ...m, url: this.toAbsoluteUrl(m.url) })),
      meta: { total, page, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
    };
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const media = await this.prisma.media.findFirst({ where });
    if (!media) throw new NotFoundException("Media not found");
    return { ...media, url: this.toAbsoluteUrl(media.url) };
  }

  async update(id: string, tenantId: string, data: { alt?: string; folder?: string; originalName?: string }) {
    await this.findById(id, tenantId);
    return this.prisma.media.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    const media = await this.findById(id, tenantId);

    if (this.isR2Enabled && this.s3Client && media.url.startsWith("http")) {
      const bucket = process.env.R2_BUCKET_NAME;
      const cleanFolder = media.folder && media.folder !== "/" ? media.folder : "";
      const objectKey = cleanFolder ? `${tenantId}/${cleanFolder}/${media.storedName}` : `${tenantId}/${media.storedName}`;
      try {
        await this.s3Client.send(new DeleteObjectCommand({ Bucket: bucket!, Key: objectKey }));
      } catch (err) {
        console.error("Failed to delete from R2", err);
      }
    } else {
      const filePath = path.join(this.storagePath, tenantId, media.folder && media.folder !== "/" ? media.folder : "", media.storedName);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await this.prisma.$transaction([
      this.prisma.media.delete({ where: { id } }),
      this.prisma.tenant.update({
        where: { id: tenantId },
        data: { storageUsed: { decrement: Number(media.size) } },
      }),
    ]);

    return { deleted: true };
  }
}
