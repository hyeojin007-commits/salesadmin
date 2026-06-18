"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

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
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchProducts = () => fetch("/api/products").then((r) => r.json()).then(setProducts);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((p) => p.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개 제품을 삭제하시겠습니까?`)) return;
    for (const id of selectedIds) {
      await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    }
    setSelectedIds(new Set());
    fetchProducts();
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/products/bulk", { method: "POST", body: formData });
    const data = await res.json();
    alert(data.message || data.error);
    setUploading(false);
    e.target.value = "";
    fetchProducts();
  };

  const downloadTemplate = () => {
    const data = [
      ["제품명", "카테고리", "단가", "단위", "설명"],
      ["예시제품", "CCTV", 100000, "EA", "제품 설명"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "제품목록");
    XLSX.writeFile(wb, "제품_일괄등록_양식.xlsx");
  };

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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">제품 관리</h1>
        <div className="flex gap-2 items-center">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm">
              선택 삭제 ({selectedIds.size})
            </button>
          )}
          <button onClick={downloadTemplate} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 text-sm">
            양식 다운로드
          </button>
          <label className={`bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm cursor-pointer ${uploading ? "opacity-50" : ""}`}>
            {uploading ? "업로드 중..." : "일괄 업로드"}
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkUpload} className="hidden" disabled={uploading} />
          </label>
          <button
            onClick={() => showForm ? handleCancel() : setShowForm(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            {showForm ? "닫기" : "제품 등록"}
          </button>
        </div>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="제품명, 카테고리, 설명으로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
              <th className="px-4 py-3 text-center">
                <input type="checkbox" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleAll} className="rounded" />
              </th>
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
            {filtered.map((p) => (
              <tr key={p.id} className={selectedIds.has(p.id) ? "bg-blue-50" : ""}>
                <td className="px-4 py-3 text-center">
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                </td>
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {search ? "검색 결과가 없습니다." : "등록된 제품이 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
