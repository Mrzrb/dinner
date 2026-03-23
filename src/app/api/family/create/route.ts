import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie, setAuthCookie } from "@/lib/auth";
import { jsonError, jsonSuccess, generateInviteCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) return jsonError("未登录", 401);

    if (auth.familyId) return jsonError("你已在一个家庭中");

    const body = await request.json();
    const { name } = body;

    if (!name) return jsonError("请输入家庭名称");

    let inviteCode = generateInviteCode();
    // Ensure unique
    while (await prisma.family.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    const family = await prisma.family.create({
      data: {
        name,
        inviteCode,
        members: { connect: { id: auth.userId } },
      },
    });

    // Make creator ADMIN
    await prisma.user.update({
      where: { id: auth.userId },
      data: { role: "ADMIN", familyId: family.id },
    });

    // Refresh cookie with new role and familyId
    await setAuthCookie({
      ...auth,
      role: "ADMIN",
      familyId: family.id,
    });

    return jsonSuccess({ id: family.id, name: family.name, inviteCode: family.inviteCode }, 201);
  } catch {
    return jsonError("创建失败，请重试", 500);
  }
}
