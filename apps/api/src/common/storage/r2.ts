import { S3Client } from "@aws-sdk/client-s3";

/**
 * Los valores de R2 vienen de .env o del gestor de secretos y arrastran con
 * frecuencia BOM, zero-width, comillas o un salto de línea final. Esos
 * caracteres viajan literales dentro de la cabecera `Authorization` (SigV4
 * incluye el access key id en el scope `Credential=`) y Node aborta la peticion
 * con ERR_INVALID_CHAR antes de enviarla, sin llegar a Cloudflare.
 */
const UNSAFE_CREDENTIAL_CHARS =
  /[\u0000-\u0020\u007f-\u00a0\u200b-\u200f\u2028\u2029\u2060\ufeff]/g;

const warned = new Set<string>();

/** Normaliza un valor de entorno para que sea seguro dentro de cabeceras HTTP. */
export function sanitizeEnvValue(name: string): string {
  const raw = process.env[name];
  if (!raw) return "";
  const cleaned = raw.replace(UNSAFE_CREDENTIAL_CHARS, "").replace(/^["']|["']$/g, "").trim();
  if (cleaned !== raw && !warned.has(name)) {
    warned.add(name);
    // Nunca se registra el valor, solo su longitud.
    console.warn(
      `[storage] ${name} contenia caracteres no validos para cabeceras HTTP y fue normalizado ` +
        `(longitud ${raw.length} -> ${cleaned.length}). Revisa el valor guardado en el gestor de secretos.`
    );
  }
  return cleaned;
}

export function r2AccountId(): string {
  return sanitizeEnvValue("R2_ACCOUNT_ID");
}

export function r2Bucket(): string {
  return sanitizeEnvValue("R2_BUCKET_NAME");
}

export function r2PublicBase(): string {
  return sanitizeEnvValue("R2_PUBLIC_URL").replace(/\/+$/, "");
}

/** Endpoint de R2. Acepta account id, host completo o URL completa. */
export function r2Endpoint(): string {
  const raw = r2AccountId();
  if (!raw) return "";
  if (raw.startsWith("http")) return raw.replace(/\/+$/, "");
  if (raw.includes(".r2.cloudflarestorage.com")) return `https://${raw}`;
  return `https://${raw}.r2.cloudflarestorage.com`;
}

export function r2Enabled(): boolean {
  return Boolean(
    sanitizeEnvValue("R2_ACCOUNT_ID") &&
      sanitizeEnvValue("R2_ACCESS_KEY_ID") &&
      sanitizeEnvValue("R2_SECRET_ACCESS_KEY") &&
      r2Bucket()
  );
}

/**
 * Problemas de configuracion que ningun saneado puede arreglar (por ejemplo una
 * clave truncada o copiada con caracteres que no son hex). Vacio = R2 utilizable.
 */
export function r2ConfigProblems(): string[] {
  const problems: string[] = [];
  const accountId = r2AccountId();
  const accessKeyId = sanitizeEnvValue("R2_ACCESS_KEY_ID");
  const secretAccessKey = sanitizeEnvValue("R2_SECRET_ACCESS_KEY");
  const bucket = r2Bucket();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return problems;

  const isCloudflareEndpoint = r2Endpoint().includes(".r2.cloudflarestorage.com");

  if (isCloudflareEndpoint && !/^[0-9a-f]{32}$/i.test(accountId)) {
    problems.push(`R2_ACCOUNT_ID debe ser un account id de 32 caracteres hexadecimales (longitud ${accountId.length}).`);
  }
  if (isCloudflareEndpoint && !/^[0-9a-f]{32}$/i.test(accessKeyId)) {
    problems.push(`R2_ACCESS_KEY_ID debe ser una access key de 32 caracteres hexadecimales (longitud ${accessKeyId.length}).`);
  }
  if (isCloudflareEndpoint && !/^[0-9a-f]{64}$/i.test(secretAccessKey)) {
    problems.push(`R2_SECRET_ACCESS_KEY debe ser una secret key de 64 caracteres hexadecimales (longitud ${secretAccessKey.length}).`);
  }
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) {
    problems.push(`R2_BUCKET_NAME no es un nombre de bucket valido (longitud ${bucket.length}).`);
  }

  return problems;
}

export function createR2Client(): S3Client | null {
  if (!r2Enabled()) return null;
  return new S3Client({
    region: "auto",
    endpoint: r2Endpoint(),
    credentials: {
      accessKeyId: sanitizeEnvValue("R2_ACCESS_KEY_ID"),
      secretAccessKey: sanitizeEnvValue("R2_SECRET_ACCESS_KEY"),
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

const R2_ERROR_HINTS: Record<string, string> = {
  ERR_INVALID_CHAR:
    "el valor de las credenciales R2 tiene caracteres que Node no permite en cabeceras HTTP",
  Unauthorized:
    "credenciales R2 invalidas o revocadas: regenera el token en Cloudflare y actualiza R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY",
  AccessDenied: "el token R2 no tiene permiso sobre el bucket configurado",
  InvalidAccessKeyId: "R2_ACCESS_KEY_ID no existe en la cuenta de R2 indicada",
  SignatureDoesNotMatch: "R2_SECRET_ACCESS_KEY no corresponde a R2_ACCESS_KEY_ID",
  NoSuchBucket: "el bucket de R2_BUCKET_NAME no existe",
  NetworkingError: "no hay salida de red hacia r2.cloudflarestorage.com",
  ENOTFOUND: "el host de R2 no resuelve; revisa R2_ACCOUNT_ID",
};

/** Mensaje accionable para errores de R2 (antes solo seellia el code opaco). */
export function describeR2Error(err: any): string {
  const code = String(err?.code || err?.name || "Error");
  const status = err?.$metadata?.httpStatusCode;
  const detail = err?.message || String(err);
  const hint = R2_ERROR_HINTS[code];
  const label = status ? `${code} (HTTP ${status})` : code;
  return hint ? `${label}: ${detail}. ${hint}.` : `${label}: ${detail}.`;
}