"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
}

interface FamilyInfo {
  id: string;
  name: string;
  inviteCode: string;
  members: Member[];
}

interface UserInfo {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/family/info").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ]).then(([familyData, userData]) => {
      if (familyData.id) setFamily(familyData);
      if (userData.id) setUser(userData);
      setLoading(false);
    });
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function copyInviteCode() {
    if (!family) return;
    navigator.clipboard.writeText(family.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function updateMemberRole(memberId: string, role: string) {
    await fetch("/api/family/role", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role }),
    });
    const res = await fetch("/api/family/info");
    const data = await res.json();
    if (data.id) setFamily(data);
  }

  if (loading) return <div className="p-4 text-center text-neutral-400 py-12">加载中...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-6">设置</h1>

      {/* User info */}
      {user && (
        <div className="bg-white rounded-xl p-4 border border-neutral-200 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-neutral-400">{ROLE_LABELS[user.role]}</p>
            </div>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                <span className="text-neutral-700 font-medium">{user.name[0]}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Family info */}
      {family && (
        <>
          <div className="bg-white rounded-xl p-4 border border-neutral-200 mb-4">
            <h2 className="font-semibold mb-3">家庭信息</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-500 text-sm">家庭名称</span>
                <span className="text-sm font-medium">{family.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 text-sm">邀请码</span>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-2 bg-neutral-100 text-neutral-900 px-3 py-1 rounded-lg text-sm font-mono"
                >
                  {family.inviteCode}
                  <span className="text-xs">{copied ? "已复制" : "复制"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-neutral-200 mb-4">
            <h2 className="font-semibold mb-3">成员 ({family.members.length})</h2>
            <div className="space-y-3">
              {family.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                        <span className="text-neutral-600 text-sm font-medium">{member.name[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      {member.phone && (
                        <p className="text-xs text-neutral-400">{member.phone}</p>
                      )}
                    </div>
                  </div>
                  {user?.role === "ADMIN" && member.id !== user?.id ? (
                    <select
                      value={member.role}
                      onChange={(e) => updateMemberRole(member.id, e.target.value)}
                      className="text-xs border border-neutral-200 rounded-lg px-2 py-1"
                    >
                      <option value="MEMBER">成员</option>
                      <option value="COOK">厨师</option>
                      <option value="ADMIN">管理员</option>
                    </select>
                  ) : (
                    <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded">
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        onClick={handleLogout}
        className="w-full bg-white text-red-500 py-3 rounded-xl border border-neutral-200 font-medium hover:bg-red-50 transition-colors"
      >
        退出登录
      </button>
    </div>
  );
}
