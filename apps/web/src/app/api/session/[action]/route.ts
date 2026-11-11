import { NextRequest, NextResponse } from "next/server";
import { resolveApiBaseUrl } from "@/lib/api-config";

/**
 * Proxy de sesión en el mismo dominio del panel.
 *
 * El API vive en otro sitio (Cloud Run), así que sus cookies no viajan con las peticiones
 * del panel. Este proxy guarda el refresh token en una cookie httpOnly del dominio del panel
 * (JavaScript no puede leerla) y solo devuelve al navegador el access token, que el panel
 * guarda en memoria. Así un XSS ya no puede robar la sesión desde localStorage.
 */

const ACTIONS = new Set(["login", "verify-email", "refresh", "logout"]);
const COOKIE = "pf_refresh";
const COOKIE_PATH = "/api/session";
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return (fwd.split(",")[0] || req.headers.get("x-real-ip") || "").trim();
}

function setRefreshCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: REFRESH_MAX_AGE,
  });
}

function clearRefreshCookie(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: COOKIE_PATH, maxAge: 0 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (!ACTIONS.has(action)) return NextResponse.json({ message: "Not found" }, { status: 404 });

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  if (!body || typeof body !== "object" || Array.isArray(body)) body = {};

  // refresh / logout usan la cookie. Se acepta un refreshToken en el body solo para migrar
  // sesiones antiguas que lo tenían guardado en localStorage.
  if (action === "refresh" || action === "logout") {
    const fromCookie = req.cookies.get(COOKIE)?.value;
    body = { refreshToken: fromCookie || (typeof body.refreshToken === "string" ? body.refreshToken : undefined) };
    if (!body.refreshToken) {
      const res = NextResponse.json({ message: "Sesión no encontrada" }, { status: action === "logout" ? 200 : 401 });
      clearRefreshCookie(res);
      return res;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": req.headers.get("user-agent") || "",
  };
  // El API solo confía en la IP del cliente si viene con la clave compartida del proxy:
  // sin esto, todos los logins parecerían salir de las IPs de Vercel (rate limit compartido).
  const proxyKey = process.env.SESSION_PROXY_KEY;
  const ip = clientIp(req);
  if (proxyKey && ip) {
    headers["X-Session-Proxy-Key"] = proxyKey;
    headers["X-Session-Client-Ip"] = ip;
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)}/auth/${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err: any) {
    console.error(`[session] No se pudo contactar al API (${action}): ${err?.message}${err?.cause ? ` — ${err.cause?.message || err.cause}` : ""}`);
    return NextResponse.json({ message: "No se pudo contactar al servidor" }, { status: 502 });
  }

  const json: any = await apiRes.json().catch(() => ({}));
  const payload = json?.data && typeof json.data === "object" ? json.data : json;
  const refreshToken: string | undefined = payload?.refreshToken;
  if (payload && typeof payload === "object") delete payload.refreshToken;

  const res = NextResponse.json(json, { status: apiRes.status });
  res.headers.set("Cache-Control", "no-store");
  if (action === "logout") clearRefreshCookie(res);
  else if (apiRes.ok && refreshToken) setRefreshCookie(res, refreshToken);
  else if (action === "refresh" && apiRes.status === 401) clearRefreshCookie(res);
  return res;
}
