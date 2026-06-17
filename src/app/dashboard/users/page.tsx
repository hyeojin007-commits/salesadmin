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
  const [form, setForm] = useState({
    email: "", name: "", password: "", role: "DEALER", company: "", phone: "",
  });

  const fetchUsers = () => fetch("/api/users").then((r) => r.json()).then(setUsers);

  useEffect(() => { fetchUsers(); }, []);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          {showForm ? "닫기" : "사용자 등록"}
        </button>
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
              className="w-full border rounded px-3 py-2 text-sm text-gray-900" required />
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
