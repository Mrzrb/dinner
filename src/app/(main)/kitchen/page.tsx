"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MEAL_LABELS, CATEGORY_LABELS } from "@/lib/utils";

interface RecipeSummary {
  recipeId: string;
  recipeName: string;
  category: string;
  totalQuantity: number;
  orderedBy: string[];
}

interface MealSummary {
  mealType: string;
  recipeSummary: RecipeSummary[];
}

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER"] as const;

export default function KitchenPage() {
  const [summary, setSummary] = useState<MealSummary[]>([]);
  const [activeMeal, setActiveMeal] = useState("LUNCH");
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orders/summary?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSummary(data);
      })
      .finally(() => setLoading(false));
  }, [date]);

  const activeSummary = summary.find((s) => s.mealType === activeMeal);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">后厨汇总</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5"
        />
      </div>

      {/* Meal tabs */}
      <div className="flex gap-2 mb-6">
        {MEAL_TYPES.map((meal) => {
          const mealData = summary.find((s) => s.mealType === meal);
          const count = mealData?.recipeSummary.length || 0;
          return (
            <button
              key={meal}
              onClick={() => setActiveMeal(meal)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeMeal === meal
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {MEAL_LABELS[meal]}
              {count > 0 && (
                <span className={`ml-1 ${activeMeal === meal ? "text-neutral-400" : "text-neutral-400"}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center text-neutral-400 py-12">加载中...</div>
      ) : !activeSummary || activeSummary.recipeSummary.length === 0 ? (
        <div className="text-center text-neutral-400 py-12">
          <p className="text-lg mb-1">暂无点菜</p>
          <p className="text-sm">还没有人点{MEAL_LABELS[activeMeal]}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeSummary.recipeSummary.map((item) => (
            <Link key={item.recipeId} href={`/recipes/${item.recipeId}`} className="block bg-white rounded-xl p-4 border border-neutral-200 active:bg-neutral-50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{item.recipeName}</p>
                  <p className="text-xs text-neutral-400">{CATEGORY_LABELS[item.category]}</p>
                </div>
                <span className="bg-neutral-900 text-white px-3 py-1 rounded-full text-sm font-medium">
                  x{item.totalQuantity}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {item.orderedBy.map((name) => (
                  <span key={name} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                    {name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
