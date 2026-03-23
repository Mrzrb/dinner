"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      router.push("/family/join");
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-8">
      <h1 className="text-xl font-semibold text-center mb-2">家庭点菜</h1>
      <p className="text-gray-500 text-center mb-8">创建新账号</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入姓名"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码（至少6位）"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 text-white py-3 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "注册中..." : "注册"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        已有账号？{" "}
        <Link href="/login" className="text-neutral-900 font-medium">
          登录
        </Link>
      </p>
    </div>
  );
}
