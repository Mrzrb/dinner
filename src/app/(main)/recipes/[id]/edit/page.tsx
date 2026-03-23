"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CATEGORY_LABELS } from "@/lib/utils";

const CATEGORIES = ["MEAT", "VEGETABLE", "SOUP", "STAPLE", "SNACK", "OTHER"];

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  order: number;
  content: string;
}

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("MEAT");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", amount: "", unit: "" }]);
  const [steps, setSteps] = useState<Step[]>([{ order: 1, content: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/recipes/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setName(data.name);
          setCategory(data.category);
          if (Array.isArray(data.ingredients) && data.ingredients.length > 0)
            setIngredients(data.ingredients);
          if (Array.isArray(data.steps) && data.steps.length > 0)
            setSteps(data.steps);
        }
        setLoading(false);
      });
  }, [params.id]);

  function addIngredient() {
    setIngredients([...ingredients, { name: "", amount: "", unit: "" }]);
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  function removeIngredient(index: number) {
    if (ingredients.length === 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function addStep() {
    setSteps([...steps, { order: steps.length + 1, content: "" }]);
  }

  function updateStep(index: number, content: string) {
    const updated = [...steps];
    updated[index] = { ...updated[index], content };
    setSteps(updated);
  }

  function removeStep(index: number) {
    if (steps.length === 1) return;
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const filteredIngredients = ingredients.filter((i) => i.name.trim());
    const filteredSteps = steps.filter((s) => s.content.trim());

    try {
      const res = await fetch(`/api/recipes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          ingredients: filteredIngredients,
          steps: filteredSteps,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push(`/recipes/${params.id}`);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-4 text-center text-neutral-400 py-12">加载中...</div>;

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center mb-6">
        <button onClick={() => router.back()} className="mr-3 text-neutral-500">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">编辑菜谱</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">菜名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">分类</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  category === cat ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-700">食材</label>
            <button type="button" onClick={addIngredient} className="text-sm text-neutral-900">+ 添加</button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} placeholder="食材" className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
                <input type="text" value={ing.amount} onChange={(e) => updateIngredient(i, "amount", e.target.value)} placeholder="用量" className="w-20 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
                <input type="text" value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)} placeholder="单位" className="w-16 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900" />
                <button type="button" onClick={() => removeIngredient(i)} className="text-neutral-300 hover:text-red-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-700">步骤</label>
            <button type="button" onClick={addStep} className="text-sm text-neutral-900">+ 添加</button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 text-xs flex items-center justify-center flex-shrink-0 mt-2">{i + 1}</span>
                <textarea value={step.content} onChange={(e) => updateStep(i, e.target.value)} placeholder={`步骤 ${i + 1}`} rows={2} className="flex-1 px-3 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none" />
                <button type="button" onClick={() => removeStep(i)} className="text-neutral-300 hover:text-red-500 mt-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors">
          {submitting ? "保存中..." : "保存修改"}
        </button>
      </form>
    </div>
  );
}
