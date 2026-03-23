import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setAuthCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { phone, password } = body;

  if (!phone || !password) {
    return jsonError("请输入手机号和密码");
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return jsonError("手机号或密码错误");
  }

  if (!user.passwordHash) {
    return jsonError("该账号未设置密码，请使用微信登录");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return jsonError("手机号或密码错误");
  }

  await setAuthCookie({
    userId: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    familyId: user.familyId,
  });

  return jsonSuccess({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    familyId: user.familyId,
  });
}
