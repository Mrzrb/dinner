import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/wechat",
];
const NEED_LOGIN_ONLY = ["/family/create", "/family/join", "/api/family/create", "/api/family/join"];
const COOK_ADMIN_PATHS = ["/kitchen", "/recipes/new", "/api/orders/summary"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function needsLoginOnly(pathname: string) {
  return NEED_LOGIN_ONLY.some((p) => pathname.startsWith(p));
}

function needsCookAdmin(pathname: string) {
  if (COOK_ADMIN_PATHS.some((p) => pathname.startsWith(p))) return true;
  if (/\/recipes\/[^/]+\/edit/.test(pathname)) return true;
  return false;
}

function isWeChatBrowser(ua: string): boolean {
  return /MicroMessenger/i.test(ua);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("dinner-token")?.value;
  const user = token ? verifyToken(token) : null;

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // WeChat browser: auto-redirect to WeChat OAuth
    const ua = request.headers.get("user-agent") || "";
    if (isWeChatBrowser(ua)) {
      const redirectUrl = new URL("/api/auth/wechat", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (needsLoginOnly(pathname)) {
    return NextResponse.next();
  }

  // All other routes require family membership
  if (!user.familyId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "请先加入家庭" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/family/join", request.url));
  }

  // Check COOK/ADMIN for restricted paths
  if (needsCookAdmin(pathname)) {
    if (user.role !== "ADMIN" && user.role !== "COOK") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "权限不足" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/order", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
