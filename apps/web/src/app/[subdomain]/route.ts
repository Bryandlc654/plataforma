import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  const { subdomain } = await params;

  if (!subdomain || subdomain === "favicon.ico" || subdomain === "_next") {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    
    // Call the public API endpoint that returns the full HTML string
    const res = await fetch(`${apiBase}/p/${subdomain}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return new NextResponse("Site Not Found", { status: 404 });
    }

    const html = await res.text();
    
    // Return the exact raw HTML from the API
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
