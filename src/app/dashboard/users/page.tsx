"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: string;
  phone?: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  SALES: "영업팀",
  DISTRIBUTOR: "총판",
  DEALER: "대리점",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    email: "", name: "", password: "", role: "DEALER", company: "", phone: "",
  });
  const [pwModal, setPwModal] = useState<{ id: string; name: string } | null>(null);
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");

  const fetchUsers = () => fetch("/api/users").then((r) => r.json()).then(setUsers);

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.company || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ email: "", name: "", password: "", role: "DEALER", company: "", phone: "" });
    setShowForm(false);
    fetchUsers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 사용자를 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchUsers();
    else { const data = await res.json(); alert(data.error || "삭제 실패"); }
  };

  const handlePasswordReset = async () => {
    if (!pwModal) return;
    setPwMsg("");
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pwModal.id, newPassword: newPw }),
    });
    const data = await res.json();
    if (res.ok) {
      setPwMsg(data.message);
      setTimeout(() => { setPwModal(null); setNewPw(""); setPwMsg(""); }, 1500);
    } else {
      setPwMsg(data.error || "변경 실패");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          {showForm ? "닫기" : "사용자 등록"}
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="이름, 이메일, 소속으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">이메일</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900" required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">비밀번호</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900" required minLength={6} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">역할</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900">
              <option value="ADMIN">관리자</option>
              <option value="SALES">영업팀</option>
              <option value="DISTRIBUTOR">총판</option>
              <option value="DEALER">대리점</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">회사</label>
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">연락처</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900" />
          </div>
          <div className="col-span-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 text-sm">
              등록
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.company || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.phone || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <button
                    onClick={() => { setPwModal({ id: u.id, name: u.name }); setNewPw(""); setPwMsg(""); }}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    비밀번호 변경
                  </button>
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {search ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pwModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 space-y-3">
            <h3 className="text-lg font-bold text-gray-900">비밀번호 변경</h3>
            <p className="text-sm text-gray-600">{pwModal.name}</p>
            <input
              type="password"
              placeholder="새 비밀번호 (6자 이상)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              minLength={6}
            />
            {pwMsg && <p className={`text-xs ${pwMsg.includes("변경") ? "text-green-600" : "text-red-500"}`}>{pwMsg}</p>}
            <div className="flex gap-2">
              <button onClick={handlePasswordReset} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">변경</button>
              <button onClick={() => setPwModal(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
