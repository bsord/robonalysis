import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Allow static, API, and unlock page without auth
  const openPaths = [
    "/unlock",
    "/api", // allow all API routes
    "/api/unlock",
    "/_next",
    "/favicon.ico",
    "/icon.svg",
    "/robotevents.png",
    "/robots.txt",
    "/sitemap.xml",
    "/globe.svg",
    "/next.svg",
    "/vercel.svg",
    "/window.svg",
    "/file.svg",
    "/favicon.png",
    "/favicon.svg",
  ];
  const isOpen = openPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isOpen) return NextResponse.next();

  const cookie = req.cookies.get("vv_auth")?.value;
  if (cookie === "1") return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!.+\.[\w]+$|_next).*)",
  ],
};
