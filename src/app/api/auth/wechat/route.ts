import { NextRequest, NextResponse } from "next/server";
import { getWxAuthorizeUrl } from "@/lib/wechat";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get("redirect") || "/order";

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
  const callbackUrl = `${baseUrl}/api/auth/wechat/callback`;

  const authorizeUrl = getWxAuthorizeUrl(callbackUrl, encodeURIComponent(redirect));

  return NextResponse.redirect(authorizeUrl);
}
