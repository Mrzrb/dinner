"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push("/order");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-neutral-200 p-8">
        <h1 className="text-xl font-semibold text-center mb-2">创建家庭</h1>
        <p className="text-gray-500 text-center mb-8">创建后分享邀请码给家人</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">家庭名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：张家"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "创建中..." : "创建家庭"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          已有家庭邀请码？{" "}
          <Link href="/family/join" className="text-neutral-900 font-medium">
            加入家庭
          </Link>
        </p>
      </div>
    </div>
  );
}
