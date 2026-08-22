import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PLATFORM_HOSTNAMES = ["localhost", "build.icebergup.com", "127.0.0.1"];

const protectedPaths = ["/dashboard"];
const authPaths = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") || "";
  const cleanHost = hostname.split(":")[0];

  // Custom domain routing: serve the site mapped to this domain at ANY path.
  // Platform hosts (the app itself, subdomains of the platform) fall through to
  // the [subdomain] route so the correct site is served and tracked.
  const isPlatformHost =
    PLATFORM_HOSTNAMES.includes(cleanHost) ||
    cleanHost.endsWith(".icebergup.com") ||
    cleanHost.endsWith(".vercel.app");

  if (!isPlatformHost) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    // Try the exact host first; if not found, retry with the "www." variant so that
    // apex domains (e.g. rodriplast.com) resolve to the site mapped to www.rodriplast.com.
    const hosts = cleanHost.startsWith("www.")
      ? [cleanHost, cleanHost.slice(4)]
      : [cleanHost, `www.${cleanHost}`];
    try {
      for (const host of hosts) {
        let apiUrl = `${apiBase}/p/${host}`;
        if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
          apiUrl += pathname;
        } else if (pathname !== "/") {
          apiUrl += `?path=${encodeURIComponent(pathname)}`;
        }
        const res = await fetch(apiUrl, {
          headers: { "Accept": "text/html" },
        });
        if (res.ok) {
          const body = await res.text();
          const contentType = pathname.endsWith(".xml")
            ? "application/xml; charset=utf-8"
            : pathname.endsWith(".txt")
              ? "text/plain; charset=utf-8"
              : "text/html; charset=utf-8";
          return new NextResponse(body, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "no-store, no-cache, must-revalidate",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }
      }
    } catch {}

    // No site is mapped to this custom domain: never show the platform app here
    return new NextResponse("Site not found", { status: 404 });
  }

  // Regular auth middleware for platform routes
  const token = request.cookies.get("auth_session")?.value;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthPath = authPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|fonts|images|uploads).*)"],
};
