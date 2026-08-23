import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
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

  setApk(dto: { apkUrl: string; apkVersion: string; apkName: string; apkSize: number }): GlobalApkInfo {
    this.ensureDir();

    if (existsSync(APK_FILE)) {
      const prev = this.getApk();
      if (prev?.apkUrl) {
        const filename = prev.apkUrl.split("/").pop();
        if (filename) {
          const filePath = join(DATA_DIR, filename);
          if (existsSync(filePath)) unlinkSync(filePath);
        }
      }
    }

    const info: GlobalApkInfo = {
      apkUrl: dto.apkUrl,
      apkVersion: dto.apkVersion,
      apkName: dto.apkName,
      apkSize: dto.apkSize,
      updatedAt: new Date().toISOString(),
    };

    writeFileSync(APK_FILE, JSON.stringify(info, null, 2));
    return info;
  }

  removeApk(): { deleted: true } {
    if (!existsSync(APK_FILE)) throw new NotFoundException("No hay APK configurada");

    const info = this.getApk();
    if (info?.apkUrl) {
      const filename = info.apkUrl.split("/").pop();
      if (filename) {
        const filePath = join(DATA_DIR, filename);
        if (existsSync(filePath)) unlinkSync(filePath);
      }
    }

    unlinkSync(APK_FILE);
    return { deleted: true };
  }
}
