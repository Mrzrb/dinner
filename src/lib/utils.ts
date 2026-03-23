import { NextResponse } from "next/server";

export function jsonError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const CATEGORY_LABELS: Record<string, string> = {
  MEAT: "荤菜",
  VEGETABLE: "素菜",
  SOUP: "汤",
  STAPLE: "主食",
  SNACK: "小吃",
  OTHER: "其他",
};

export const MEAL_LABELS: Record<string, string> = {
  BREAKFAST: "早餐",
  LUNCH: "午餐",
  DINNER: "晚餐",
};

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理员",
  COOK: "厨师",
  MEMBER: "成员",
};
