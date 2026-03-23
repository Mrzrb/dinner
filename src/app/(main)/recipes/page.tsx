"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/utils";

interface Recipe {
  id: string;
  name: string;
  category: string;
  imageUrl: string | null;
}

interface UserInfo {
  role: string;
}

const CATEGORIES = ["ALL", "MEAT", "VEGETABLE", "SOUP", "STAPLE", "SNACK", "OTHER"];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [category, setCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/recipes").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([recipesData, userData]) => {
      if (Array.isArray(recipesData)) setRecipes(recipesData);
      if (userData.id) setUser(userData);
      setLoading(false);
    });
  }, []);

  const filtered = category === "ALL" ? recipes : recipes.filter((r) => r.category === category);
  const canEdit = user?.role === "ADMIN" || user?.role === "COOK";

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">菜谱</h1>
        {canEdit && (
          <Link
            href="/recipes/new"
            className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            + 新菜
          </Link>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
              category === cat ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {cat === "ALL" ? "全部" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-neutral-400 py-12">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-neutral-400 py-12">
          <p className="text-lg mb-1">暂无菜谱</p>
          {canEdit && <p className="text-sm">点击右上角添加第一道菜</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              {recipe.imageUrl ? (
                <div className="aspect-square bg-neutral-100">
                  <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                  <span className="text-3xl">
                    {recipe.category === "MEAT" ? "🥩" :
                     recipe.category === "VEGETABLE" ? "🥬" :
                     recipe.category === "SOUP" ? "🍲" :
                     recipe.category === "STAPLE" ? "🍚" :
                     recipe.category === "SNACK" ? "🍡" : "🍽️"}
                  </span>
                </div>
              )}
              <div className="p-3">
                <p className="font-medium text-sm truncate">{recipe.name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{CATEGORY_LABELS[recipe.category]}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
