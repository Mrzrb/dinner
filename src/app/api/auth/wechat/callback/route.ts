import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { setAuthCookie } from "@/lib/auth";
import { getWxAccessToken, getWxUserInfo } from "@/lib/wechat";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=wx_no_code", baseUrl));
  }

  // Exchange code for access_token + openid
  const tokenData = await getWxAccessToken(code);
  if (tokenData.errcode) {
    return NextResponse.redirect(
      new URL(`/login?error=wx_token&msg=${tokenData.errmsg}`, baseUrl)
    );
  }

  // Fetch user profile from WeChat
  const wxUser = await getWxUserInfo(tokenData.access_token, tokenData.openid);
  if (wxUser.errcode) {
    return NextResponse.redirect(
      new URL(`/login?error=wx_userinfo&msg=${wxUser.errmsg}`, baseUrl)
    );
  }

  // Find or create user by wxOpenId
  let user = await prisma.user.findUnique({
    where: { wxOpenId: wxUser.openid },
  });

  if (user) {
    // Update profile from WeChat (name/avatar may change)
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: wxUser.nickname || user.name,
        avatarUrl: wxUser.headimgurl || user.avatarUrl,
        wxUnionId: wxUser.unionid || user.wxUnionId,
      },
    });
  } else {
    // Auto-register
    user = await prisma.user.create({
      data: {
        name: wxUser.nickname || "微信用户",
        wxOpenId: wxUser.openid,
        wxUnionId: wxUser.unionid,
        avatarUrl: wxUser.headimgurl,
      },
    });
  }

  // Set JWT cookie
  await setAuthCookie({
    userId: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    familyId: user.familyId,
    avatarUrl: user.avatarUrl,
  });

  // Redirect to intended page
  let redirectPath = "/order";
  if (state) {
    try {
      redirectPath = decodeURIComponent(state);
    } catch {
      // ignore decode errors
    }
  }

  // If user has no family, redirect to join
  if (!user.familyId) {
    redirectPath = "/family/join";
  }

  return NextResponse.redirect(new URL(redirectPath, baseUrl));
}
