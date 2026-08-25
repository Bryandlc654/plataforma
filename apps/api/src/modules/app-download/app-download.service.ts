import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "uploads", "app-download");
const APK_FILE = join(DATA_DIR, "app.json");

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

  private ensureDir() {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  }

  getApk(): GlobalApkInfo | null {
    if (!existsSync(APK_FILE)) return null;
    try {
      return JSON.parse(readFileSync(APK_FILE, "utf-8"));
    } catch {
      return null;
    }
  }

  async setApk(dto: { apkBuffer: Buffer; apkVersion: string; apkName: string; apkSize: number; originalFilename: string }): Promise<GlobalApkInfo> {
    this.ensureDir();

    const prev = this.getApk();
    if (prev?.apkUrl && this.isR2Enabled && this.s3Client) {
      const bucket = process.env.R2_BUCKET_NAME;
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
      const bucket = process.env.R2_BUCKET_NAME;
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
        throw new BadRequestException(`Error al subir APK a R2: ${err.message || err.name}`);
      }
      const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
      apkUrl = publicUrlBase ? `${publicUrlBase}/${objectKey}` : `https://${bucket}.r2.cloudflarestorage.com/${objectKey}`;
    } else {
      const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const filename = `${unique}.apk`;
      const filePath = join(DATA_DIR, filename);
      writeFileSync(filePath, dto.apkBuffer);
      const apiBase = process.env.PUBLIC_API_URL || "https://plataforma-api-71743315793.us-central1.run.app";
      apkUrl = `${apiBase}/uploads/app-download/${filename}`;
    }

    const info: GlobalApkInfo = {
      apkUrl,
      apkVersion: dto.apkVersion,
      apkName: dto.apkName,
      apkSize: dto.apkSize,
      updatedAt: new Date().toISOString(),
    };

    writeFileSync(APK_FILE, JSON.stringify(info, null, 2));
    return info;
  }

  async removeApk(): Promise<{ deleted: true }> {
    if (!existsSync(APK_FILE)) throw new NotFoundException("No hay APK configurada");

    const info = this.getApk();
    if (info?.apkUrl && this.isR2Enabled && this.s3Client) {
      const bucket = process.env.R2_BUCKET_NAME;
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

    unlinkSync(APK_FILE);
    return { deleted: true };
  }

  private extractR2Key(url: string): string | null {
    const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (publicUrlBase && url.startsWith(publicUrlBase)) {
      return url.substring(publicUrlBase.length + 1);
    }
    const bucket = process.env.R2_BUCKET_NAME;
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
