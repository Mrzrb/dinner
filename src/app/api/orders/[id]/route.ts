import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return jsonError("订单不存在", 404);
  if (order.userId !== auth.userId) return jsonError("无权操作", 403);

  await prisma.order.delete({ where: { id } });
  return jsonSuccess({ message: "已取消" });
}
