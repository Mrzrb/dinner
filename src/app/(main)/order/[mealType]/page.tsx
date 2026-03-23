"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MEAL_LABELS, CATEGORY_LABELS } from "@/lib/utils";

interface Recipe {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
}

interface SelectedItem {
  recipeId: string;
  quantity: number;
  note?: string;
}

const CATEGORIES = ["ALL", "MEAT", "VEGETABLE", "SOUP", "STAPLE", "SNACK", "OTHER"];

export default function MealOrderPage() {
  const params = useParams();
  const router = useRouter();
  const mealType = (params.mealType as string).toUpperCase();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      fetch("/api/recipes").then((r) => r.json()),
      fetch(`/api/orders?date=${today}&mealType=${mealType}`).then((r) => r.json()),
    ]).then(([recipesData, ordersData]) => {
      if (Array.isArray(recipesData)) setRecipes(recipesData);
      if (Array.isArray(ordersData) && ordersData.length > 0) {
        const order = ordersData[0];
        setSelected(
          order.items.map((item: { recipe: { id: string }; quantity: number; note?: string }) => ({
            recipeId: item.recipe.id,
            quantity: item.quantity,
            note: item.note,
          }))
        );
      }
      setLoading(false);
    });
  }, [today, mealType]);

  function toggleRecipe(recipeId: string) {
    setSelected((prev) => {
      const existing = prev.find((s) => s.recipeId === recipeId);
      if (existing) return prev.filter((s) => s.recipeId !== recipeId);
      return [...prev, { recipeId, quantity: 1 }];
    });
  }

  function updateQuantity(recipeId: string, delta: number) {
    setSelected((prev) =>
      prev.map((s) =>
        s.recipeId === recipeId ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s
      )
    );
  }

  function isSelected(recipeId: string) {
    return selected.some((s) => s.recipeId === recipeId);
  }

  function getQuantity(recipeId: string) {
    return selected.find((s) => s.recipeId === recipeId)?.quantity || 0;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, mealType, items: selected }),
      });
      if (res.ok) router.push("/order");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = category === "ALL" ? recipes : recipes.filter((r) => r.category === category);

  if (loading) {
    return <div className="p-4 text-center text-neutral-400 py-12">加载中...</div>;
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center mb-4">
        <button onClick={() => router.back()} className="mr-3 text-neutral-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">{MEAL_LABELS[mealType]} - 选菜</h1>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              category === cat
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {cat === "ALL" ? "全部" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      {filtered.length === 0 ? (
        <div className="text-center text-neutral-400 py-12">暂无菜谱</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((recipe) => (
            <div
              key={recipe.id}
              className={`bg-white rounded-xl p-4 border transition-colors cursor-pointer ${
                isSelected(recipe.id) ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"
              }`}
              onClick={() => toggleRecipe(recipe.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{recipe.name}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{CATEGORY_LABELS[recipe.category]}</p>
                </div>
                {isSelected(recipe.id) ? (
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => updateQuantity(recipe.id, -1)}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600"
                    >
                      -
                    </button>
                    <span className="font-medium w-4 text-center">{getQuantity(recipe.id)}</span>
                    <button
                      onClick={() => updateQuantity(recipe.id, 1)}
                      className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-neutral-300" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit bar */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-neutral-200">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="text-sm text-neutral-500">
            已选 <span className="text-neutral-900 font-semibold">{selected.length}</span> 道菜
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-neutral-900 text-white px-8 py-2.5 rounded-full font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? "提交中..." : "确认点菜"}
          </button>
        </div>
      </div>
    </div>
  );
}
