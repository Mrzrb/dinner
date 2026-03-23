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
    userId: auth.userId,
    date,
  };
  if (mealType) where.mealType = mealType;

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: {
        include: {
          recipe: { select: { id: true, name: true, category: true, imageUrl: true } },
        },
      },
    },
    orderBy: { mealType: "asc" },
  });

  return jsonSuccess(orders);
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromCookie();
  if (!auth) return jsonError("未登录", 401);
  if (!auth.familyId) return jsonError("未加入家庭", 403);

  const body = await request.json();
  const { date: dateStr, mealType, items } = body;

  if (!mealType || !items) return jsonError("缺少必要参数");

  const date = dateStr ? startOfDay(new Date(dateStr)) : startOfDay(new Date());

  // Upsert: delete existing order items, then create new
  const existing = await prisma.order.findUnique({
    where: {
      userId_date_mealType: {
        userId: auth.userId,
        date,
        mealType,
      },
    },
  });

  if (existing) {
    // Delete old items and update
    await prisma.orderItem.deleteMany({ where: { orderId: existing.id } });

    if (items.length === 0) {
      await prisma.order.delete({ where: { id: existing.id } });
      return jsonSuccess({ message: "已取消点菜" });
    }

    const order = await prisma.order.update({
      where: { id: existing.id },
      data: {
        items: {
          create: items.map((item: { recipeId: string; quantity?: number; note?: string }) => ({
            recipeId: item.recipeId,
            quantity: item.quantity || 1,
            note: item.note,
          })),
        },
      },
      include: {
        items: {
          include: { recipe: { select: { id: true, name: true, category: true } } },
        },
      },
    });

    return jsonSuccess(order);
  }

  if (items.length === 0) return jsonError("请至少选择一道菜");

  const order = await prisma.order.create({
    data: {
      date,
      mealType,
      userId: auth.userId,
      familyId: auth.familyId,
      items: {
        create: items.map((item: { recipeId: string; quantity?: number; note?: string }) => ({
          recipeId: item.recipeId,
          quantity: item.quantity || 1,
          note: item.note,
        })),
      },
    },
    include: {
      items: {
        include: { recipe: { select: { id: true, name: true, category: true } } },
      },
    },
  });

  return jsonSuccess(order, 201);
}
