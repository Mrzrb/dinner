import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";
import { Role } from "@/generated/prisma/client";

export async function PUT(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (auth.role !== "ADMIN") return jsonError("仅管理员可操作", 403);
  if (!auth.familyId) return jsonError("未加入家庭", 403);

  const body = await request.json();
  const { memberId, role } = body;

  if (!memberId || !role) return jsonError("缺少参数");
  if (!["ADMIN", "COOK", "MEMBER"].includes(role)) return jsonError("无效角色");

  const member = await prisma.user.findUnique({ where: { id: memberId } });
  if (!member || member.familyId !== auth.familyId) return jsonError("成员不存在");

  await prisma.user.update({
    where: { id: memberId },
    data: { role: role as Role },
  });

  return jsonSuccess({ message: "已更新" });
}
