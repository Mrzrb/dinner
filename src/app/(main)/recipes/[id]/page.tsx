"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/utils";

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  order: number;
  content: string;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  ingredients: Ingredient[];
  steps: Step[];
  imageUrl: string | null;
}

interface UserInfo {
  role: string;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/recipes/${params.id}`).then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([recipeData, userData]) => {
      if (recipeData.id) setRecipe(recipeData);
      if (userData.id) setUser(userData);
      setLoading(false);
    });
  }, [params.id]);

  const canEdit = user?.role === "ADMIN" || user?.role === "COOK";

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !recipe) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/image`, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) setRecipe({ ...recipe, imageUrl: data.imageUrl });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!recipe || !confirm("确定删除这道菜谱？")) return;
    const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    if (res.ok) router.push("/recipes");
  }

  if (loading) return <div className="p-4 text-center text-neutral-400 py-12">加载中...</div>;
  if (!recipe) return <div className="p-4 text-center text-neutral-400 py-12">菜谱不存在</div>;

  return (
    <div className="pb-8">
      {/* Image */}
      <div className="relative">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full aspect-video object-cover" />
        ) : (
          <div className="w-full aspect-video bg-neutral-100 flex items-center justify-center">
            <span className="text-6xl">
              {recipe.category === "MEAT" ? "🥩" :
               recipe.category === "VEGETABLE" ? "🥬" :
               recipe.category === "SOUP" ? "🍲" :
               recipe.category === "STAPLE" ? "🍚" :
               recipe.category === "SNACK" ? "🍡" : "🍽️"}
            </span>
          </div>
        )}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold">{recipe.name}</h1>
            <span className="text-sm text-neutral-400">{CATEGORY_LABELS[recipe.category]}</span>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <label className="bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-neutral-200 transition-colors">
                {uploading ? "上传中..." : "传图"}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <Link
                href={`/recipes/${recipe.id}/edit`}
                className="bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded-lg text-sm hover:bg-neutral-200 transition-colors"
              >
                编辑
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-50 text-red-500 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 transition-colors"
              >
                删除
              </button>
            </div>
          )}
        </div>

        {/* Ingredients */}
        {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold mb-3">食材</h2>
            <div className="bg-neutral-50 rounded-xl p-4">
              <div className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{ing.name}</span>
                    <span className="text-neutral-500">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        {Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold mb-3">步骤</h2>
            <div className="space-y-4">
              {recipe.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-neutral-700 leading-relaxed">{step.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
