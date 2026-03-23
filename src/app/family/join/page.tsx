"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JoinFamilyPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
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
        <h1 className="text-xl font-semibold text-center mb-2">加入家庭</h1>
        <p className="text-gray-500 text-center mb-8">输入家庭邀请码加入</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邀请码</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="6位邀请码"
              maxLength={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "加入中..." : "加入家庭"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          还没有家庭？{" "}
          <Link href="/family/create" className="text-neutral-900 font-medium">
            创建家庭
          </Link>
        </p>
      </div>
    </div>
  );
}
