import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { createR2Client, r2Bucket, r2PublicBase, r2UrlFor, describeR2Error } from "../../common/storage/r2";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "uploads", "app-download");
const APK_FILE = join(DATA_DIR, "app.json");
const INDEX_KEY = "app-download/index.json";

export interface GlobalApkInfo {
  apkUrl: string;
  apkVersion: string;
  apkName: string;
  apkSize: number;
  updatedAt: string;
}

@Injectable()
export class AppDownloadService {
  private s3Client: S3Client | null = null;
  private isR2Enabled = false;

  constructor() {
    this.s3Client = createR2Client();
    this.isR2Enabled = Boolean(this.s3Client) && Boolean(r2Bucket());
  }

  private ensureDir() {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  }

  private readLocalIndex(): GlobalApkInfo | null {
    if (!existsSync(APK_FILE)) return null;
    try {
      return JSON.parse(readFileSync(APK_FILE, "utf-8"));
    } catch {
      return null;
    }
  }

  /**
   * Lee el índice desde R2 (durable entre instancias) con fallback local.
   */
  async getApk(): Promise<GlobalApkInfo | null> {
    if (this.isR2Enabled && this.s3Client) {
      const bucket = r2Bucket();
      if (bucket) {
        try {
          const res = await this.s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: INDEX_KEY }));
          const bytes = await res.Body?.transformToByteArray();
          if (bytes && bytes.length > 0) {
            return JSON.parse(Buffer.from(bytes).toString("utf-8"));
          }
        } catch {
          /* fall back to local */
        }
      }
    }
    return this.readLocalIndex();
  }

  private async writeIndex(info: GlobalApkInfo): Promise<void> {
    if (this.isR2Enabled && this.s3Client) {
      const bucket = r2Bucket();
      if (bucket) {
        await this.s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: INDEX_KEY,
          Body: JSON.stringify(info),
          ContentType: "application/json",
        }));
      }
    }
    this.ensureDir();
    writeFileSync(APK_FILE, JSON.stringify(info, null, 2));
  }

  private async deleteIndex(): Promise<void> {
    if (this.isR2Enabled && this.s3Client) {
      const bucket = r2Bucket();
      if (bucket) {
        try {
          await this.s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: INDEX_KEY }));
        } catch {}
      }
    }
    if (existsSync(APK_FILE)) unlinkSync(APK_FILE);
  }

  async setApk(dto: { apkBuffer: Buffer; apkVersion: string; apkName: string; apkSize: number; originalFilename: string }): Promise<GlobalApkInfo> {
    this.ensureDir();

    const prev = await this.getApk();
    if (prev?.apkUrl && this.isR2Enabled && this.s3Client) {
      const bucket = r2Bucket();
      const key = this.extractR2Key(prev.apkUrl);
      if (bucket && key) {
        try {
          await this.s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        } catch {}
      }
    } else if (prev?.apkUrl && !this.isR2Enabled) {
      const filename = prev.apkUrl.split("/").pop();
      if (filename) {
        const filePath = join(DATA_DIR, filename);
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    }

    let apkUrl = "";

    if (this.isR2Enabled && this.s3Client) {
      const bucket = r2Bucket();
      if (!bucket) throw new BadRequestException("R2_BUCKET_NAME is not configured");
      const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const objectKey = `app-download/${unique}.apk`;
      try {
        await this.s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: dto.apkBuffer,
          ContentType: "application/vnd.android.package-archive",
        }));
      } catch (err: any) {
        throw new BadRequestException(`Error al subir APK a R2: ${describeR2Error(err)}`);
      }
      apkUrl = r2UrlFor(objectKey);
    } else {
      const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const filename = `${unique}.apk`;
      const filePath = join(DATA_DIR, filename);
      writeFileSync(filePath, dto.apkBuffer);
      const apiBase = process.env.PUBLIC_API_URL || "https://plataforma-api-rkav7vkxia-uc.a.run.app";
      apkUrl = `${apiBase}/uploads/app-download/${filename}`;
    }

    const info: GlobalApkInfo = {
      apkUrl,
      apkVersion: dto.apkVersion,
      apkName: dto.apkName,
      apkSize: dto.apkSize,
      updatedAt: new Date().toISOString(),
    };

    await this.writeIndex(info);
    return info;
  }

  async removeApk(): Promise<{ deleted: true }> {
    const info = await this.getApk();
    if (!info) throw new NotFoundException("No hay APK configurada");
    if (info?.apkUrl && this.isR2Enabled && this.s3Client) {
      const bucket = r2Bucket();
      const key = this.extractR2Key(info.apkUrl);
      if (bucket && key) {
        try {
          await this.s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
        } catch {}
      }
    } else if (info?.apkUrl && !this.isR2Enabled) {
      const filename = info.apkUrl.split("/").pop();
      if (filename) {
        const filePath = join(DATA_DIR, filename);
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    }

    await this.deleteIndex();
    return { deleted: true };
  }

  private extractR2Key(url: string): string | null {
    const publicUrlBase = r2PublicBase();
    if (publicUrlBase && url.startsWith(publicUrlBase)) {
      return url.substring(publicUrlBase.length + 1);
    }
    const bucket = r2Bucket();
    if (bucket && url.includes(`/${bucket}/`)) {
      const idx = url.indexOf(`/${bucket}/`) + bucket.length + 2;
      return url.substring(idx);
    }
    if (url.includes("/app-download/")) {
      const idx = url.indexOf("/app-download/");
      return url.substring(idx + 1);
    }
    return null;
  }
}
