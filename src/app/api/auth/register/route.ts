import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { phone, password, name } = body;

  if (!phone || !password || !name) {
    return jsonError("请填写完整信息");
  }

  if (!/^1\d{10}$/.test(phone)) {
    return jsonError("手机号格式不正确");
  }

  if (password.length < 6) {
    return jsonError("密码至少6位");
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return jsonError("该手机号已注册");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { phone, passwordHash, name },
  });

  await setAuthCookie({
    userId: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    familyId: user.familyId,
  });

  return jsonSuccess({ id: user.id, name: user.name, phone: user.phone, role: user.role }, 201);
}
