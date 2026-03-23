import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";

export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (!auth.familyId) return jsonError("未加入家庭", 403);

  const family = await prisma.family.findUnique({
    where: { id: auth.familyId },
    include: {
      members: {
        select: { id: true, name: true, phone: true, role: true, avatarUrl: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!family) return jsonError("家庭不存在", 404);

  return jsonSuccess(family);
}
