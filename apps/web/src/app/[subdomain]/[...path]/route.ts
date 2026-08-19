import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subdomain: string; path: string[] }> }
) {
  const { subdomain, path } = await params;

  if (!subdomain || subdomain === "favicon.ico" || subdomain === "_next") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
  const file = path[path.length - 1];

  if (file === "sitemap.xml" || file === "robots.txt") {
    try {
      const res = await fetch(`${apiBase}/p/${subdomain}/${file}`, {
        cache: "no-store",
      });
      if (!res.ok) return new NextResponse("Not Found", { status: 404 });
      const body = await res.text();
      return new NextResponse(body, {
        headers: {
          "Content-Type":
            file === "sitemap.xml"
              ? "application/xml; charset=utf-8"
              : "text/plain; charset=utf-8",
        },
      });
    } catch {
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }

  // Secondary page of a published site
  const pagePath = `/${path.join("/")}`;
  try {
    const res = await fetch(
      `${apiBase}/p/${subdomain}?path=${encodeURIComponent(pagePath)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return new NextResponse("Page Not Found", { status: 404 });
    const html = await res.text();
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
