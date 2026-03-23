import { getAuthFromCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/utils";

export async function GET() {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, phone: true, role: true, familyId: true, avatarUrl: true },
  });

  if (!user) return jsonError("用户不存在", 404);
  return jsonSuccess(user);
}
