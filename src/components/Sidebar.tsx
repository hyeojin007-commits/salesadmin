"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  SALES: "영업팀",
  DISTRIBUTOR: "총판",
  DEALER: "대리점",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [showPw, setShowPw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwErr("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    const res = await fetch("/api/users/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwMsg(data.message);
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => { setShowPw(false); setPwMsg(""); }, 1500);
    } else {
      setPwErr(data.error);
    }
  };

  const links = [
    { href: "/dashboard", label: "대시보드", roles: ["ADMIN", "SALES", "DISTRIBUTOR", "DEALER"] },
    { href: "/dashboard/quotes", label: "견적서", roles: ["ADMIN", "SALES", "DISTRIBUTOR", "DEALER"] },
    { href: "/dashboard/products", label: "제품 관리", roles: ["ADMIN", "SALES"] },
    { href: "/dashboard/users", label: "사용자 관리", roles: ["ADMIN"] },
  ];

  const filteredLinks = links.filter((l) => role && l.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">발주 관리 시스템</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {filteredLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded text-sm ${
              pathname === link.href ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {session?.user && (
        <div className="p-4 border-t border-gray-700 text-sm">
          <p className="font-medium">{session.user.name}</p>
          <p className="text-gray-400 text-xs">
            {session.user.company} · {ROLE_LABELS[session.user.role] || session.user.role}
          </p>
          <button
            onClick={() => { setShowPw(true); setPwMsg(""); setPwErr(""); }}
            className="mt-2 text-gray-400 hover:text-white text-xs block"
          >
            비밀번호 변경
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 text-gray-400 hover:text-white text-xs block"
          >
            로그아웃
          </button>
        </div>
      )}

      {showPw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handlePasswordChange} className="bg-white rounded-lg shadow-lg p-6 w-80 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">비밀번호 변경</h3>
            <input
              type="password"
              placeholder="현재 비밀번호"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              required
            />
            <input
              type="password"
              placeholder="새 비밀번호 (6자 이상)"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="새 비밀번호 확인"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              required
              minLength={6}
            />
            {pwErr && <p className="text-red-500 text-xs">{pwErr}</p>}
            {pwMsg && <p className="text-green-600 text-xs">{pwMsg}</p>}
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">변경</button>
              <button type="button" onClick={() => setShowPw(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">취소</button>
            </div>
          </form>
        </div>
      )}
    </aside>
  );
}
