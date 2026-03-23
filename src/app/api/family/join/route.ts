import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie, setAuthCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);

  if (auth.familyId) return jsonError("你已在一个家庭中");

  const body = await request.json();
  const { inviteCode } = body;

  if (!inviteCode) return jsonError("请输入邀请码");

  const family = await prisma.family.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
  });

  if (!family) return jsonError("邀请码无效");

  await prisma.user.update({
    where: { id: auth.userId },
    data: { familyId: family.id },
  });

  await setAuthCookie({
    ...auth,
    familyId: family.id,
  });

  return jsonSuccess({ id: family.id, name: family.name });
}
