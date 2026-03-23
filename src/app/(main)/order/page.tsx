"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MEAL_LABELS } from "@/lib/utils";

interface OrderItem {
  id: string;
  recipe: { id: string; name: string; category: string };
  quantity: number;
}

interface Order {
  id: string;
  mealType: string;
  items: OrderItem[];
}

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER"] as const;

export default function OrderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch(`/api/orders?date=${today}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .finally(() => setLoading(false));
  }, [today]);

  function getOrderForMeal(mealType: string) {
    return orders.find((o) => o.mealType === mealType);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-1">今日点菜</h1>
      <p className="text-sm text-neutral-500 mb-6">{today}</p>

      {loading ? (
        <div className="text-center text-neutral-400 py-12">加载中...</div>
      ) : (
        <div className="space-y-4">
          {MEAL_TYPES.map((mealType) => {
            const order = getOrderForMeal(mealType);
            return (
              <Link
                key={mealType}
                href={`/order/${mealType.toLowerCase()}`}
                className="block bg-white rounded-xl p-5 border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">{MEAL_LABELS[mealType]}</h2>
                  <span className="text-sm text-neutral-900">
                    {order ? "修改" : "去点菜"} &rarr;
                  </span>
                </div>
                {order && order.items.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <span
                        key={item.id}
                        className="bg-neutral-100 text-neutral-700 text-sm px-3 py-1 rounded-full"
                      >
                        {item.recipe.name}
                        {item.quantity > 1 && ` x${item.quantity}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">还没有点菜</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
