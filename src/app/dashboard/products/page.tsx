"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  unit: string;
  category?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", unitPrice: 0, unit: "EA", category: "" });

  const fetchProducts = () => fetch("/api/products").then((r) => r.json()).then(setProducts);

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", description: "", unitPrice: 0, unit: "EA", category: "" });
    setShowForm(false);
    fetchProducts();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">제품 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
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
            <input
              type="number"
              value={form.unitPrice}
              onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              required
            />
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품명</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">단가</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">단위</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
