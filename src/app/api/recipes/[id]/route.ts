import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);

  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return jsonError("菜谱不存在", 404);
  if (recipe.familyId !== auth.familyId) return jsonError("无权访问", 403);

  return jsonSuccess(recipe);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (auth.role !== "ADMIN" && auth.role !== "COOK") {
    return jsonError("权限不足", 403);
  }

  const { id } = await params;
  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) return jsonError("菜谱不存在", 404);
  if (existing.familyId !== auth.familyId) return jsonError("无权访问", 403);

  const body = await request.json();
  const { name, category, ingredients, steps } = body;

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(category && { category }),
      ...(ingredients !== undefined && { ingredients }),
      ...(steps !== undefined && { steps }),
    },
  });

  return jsonSuccess(recipe);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (auth.role !== "ADMIN" && auth.role !== "COOK") {
    return jsonError("权限不足", 403);
  }

  const { id } = await params;
  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) return jsonError("菜谱不存在", 404);
  if (existing.familyId !== auth.familyId) return jsonError("无权访问", 403);

  await prisma.recipe.delete({ where: { id } });
  return jsonSuccess({ message: "已删除" });
}
