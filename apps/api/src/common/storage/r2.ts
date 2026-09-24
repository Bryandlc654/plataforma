import { S3Client } from "@aws-sdk/client-s3";

export function r2Enabled(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

export function r2Bucket(): string {
  return process.env.R2_BUCKET_NAME || "";
}

export function r2PublicBase(): string {
  return (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
}

export function createR2Client(): S3Client | null {
  if (!r2Enabled()) return null;
  const raw = process.env.R2_ACCOUNT_ID as string;
  let endpoint = `https://${raw}.r2.cloudflarestorage.com`;
  if (raw.startsWith("http")) {
    endpoint = raw;
  } else if (raw.includes(".r2.cloudflarestorage.com")) {
    endpoint = `https://${raw}`;
  }
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
  });
}

export function r2UrlFor(key: string): string {
  const base = r2PublicBase();
  if (base) return `${base}/${key}`;
  return `https://${r2Bucket()}.r2.cloudflarestorage.com/${key}`;
}

/** Extrae la key relativa desde una URL pública de R2. */
export function r2KeyFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = r2PublicBase();
  if (base && url.startsWith(base)) return url.slice(base.length + 1);
  const bucket = r2Bucket();
  if (bucket && url.includes(`/${bucket}/`)) {
    const idx = url.indexOf(`/${bucket}/`) + bucket.length + 2;
    return url.slice(idx);
  }
  return null;
}
