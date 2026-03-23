import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";
import { jsonError, jsonSuccess } from "@/lib/utils";
import { Category } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (!auth.familyId) return jsonError("未加入家庭", 403);

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { familyId: auth.familyId };
  if (category && category !== "ALL") {
    where.category = category as Category;
  }

  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  return jsonSuccess(recipes);
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (!auth.familyId) return jsonError("未加入家庭", 403);
  if (auth.role !== "ADMIN" && auth.role !== "COOK") {
    return jsonError("权限不足", 403);
  }

  const body = await request.json();
  const { name, category, ingredients, steps } = body;

  if (!name || !category) {
    return jsonError("请填写菜名和分类");
  }

  const recipe = await prisma.recipe.create({
    data: {
      name,
      category,
      ingredients: ingredients || [],
      steps: steps || [],
      familyId: auth.familyId,
      createdBy: auth.userId,
    },
  });

  return jsonSuccess(recipe, 201);
}
