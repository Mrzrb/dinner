import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthFromCookie } from "@/lib/auth";
import { jsonError, jsonSuccess, startOfDay } from "@/lib/utils";
import { MealType } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (!auth.familyId) return jsonError("未加入家庭", 403);

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const mealType = searchParams.get("mealType") as MealType | null;

  const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(new Date());

  const where: Record<string, unknown> = {
    familyId: auth.familyId,
    date,
  };
  if (mealType) where.mealType = mealType;

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
      items: {
        include: {
          recipe: { select: { id: true, name: true, category: true, imageUrl: true } },
        },
      },
    },
    orderBy: [{ mealType: "asc" }, { createdAt: "asc" }],
  });

  // Group by mealType, then aggregate recipes
  const summary: Record<string, {
    mealType: string;
    orders: typeof orders;
    recipeSummary: { recipeId: string; recipeName: string; category: string; totalQuantity: number; orderedBy: string[] }[];
  }> = {};

  for (const order of orders) {
    if (!summary[order.mealType]) {
      summary[order.mealType] = {
        mealType: order.mealType,
        orders: [],
        recipeSummary: [],
      };
    }
    summary[order.mealType].orders.push(order);

    for (const item of order.items) {
      const existing = summary[order.mealType].recipeSummary.find(
        (r) => r.recipeId === item.recipeId
      );
      if (existing) {
        existing.totalQuantity += item.quantity;
        if (!existing.orderedBy.includes(order.user.name)) {
          existing.orderedBy.push(order.user.name);
        }
      } else {
        summary[order.mealType].recipeSummary.push({
          recipeId: item.recipeId,
          recipeName: item.recipe.name,
          category: item.recipe.category,
          totalQuantity: item.quantity,
          orderedBy: [order.user.name],
        });
      }
    }
  }

  return jsonSuccess(Object.values(summary));
}
