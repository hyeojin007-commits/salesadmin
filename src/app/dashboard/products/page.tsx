"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  unit: string;
  category?: string;
  updatedAt: string;
}

const emptyForm = { id: "", name: "", description: "", unitPrice: 0, unit: "EA", category: "" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchProducts = () => fetch("/api/products").then((r) => r.json()).then(setProducts);

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm(emptyForm);
    setShowForm(false);
    setEditing(false);
    fetchProducts();
  };

  const handleEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      description: p.description || "",
      unitPrice: p.unitPrice,
      unit: p.unit,
      category: p.category || "",
    });
    setEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 제품을 삭제하시겠습니까?`)) return;
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">제품 관리</h1>
        <button
          onClick={() => showForm ? handleCancel() : setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          {showForm ? "닫기" : "제품 등록"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">제품명</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">카테고리</label>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">단가</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={form.unitPrice ? `₩${form.unitPrice.toLocaleString()}` : ""}
                placeholder="₩0"
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, "");
                  setForm({ ...form, unitPrice: raw ? Number(raw) : 0 });
                }}
                className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">단위</label>
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">설명</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 text-sm">
              {editing ? "수정 완료" : "등록"}
            </button>
            {editing && (
              <button type="button" onClick={handleCancel} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md text-sm">
                취소
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">단가</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">단위</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">최근 수정</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.category || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-900">₩{p.unitPrice.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.unit}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.description || "-"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(p.updatedAt).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  등록된 제품이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
