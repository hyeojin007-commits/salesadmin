"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
  category?: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
}

export default function OrderForm({ onSuccess }: { onSuccess: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItem[]>([{ productId: "", quantity: 1 }]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const addItem = () => setItems([...items, { productId: "", quantity: 1 }]);

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof OrderItem, value: string | number) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const totalAmount = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.unitPrice * item.quantity : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const validItems = items.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) return;

    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: validItems, note }),
    });

    setSubmitting(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">새 발주 요청</h2>

      {items.map((item, idx) => (
        <div key={idx} className="flex gap-3 mb-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">제품</label>
            <select
              value={item.productId}
              onChange={(e) => updateItem(idx, "productId", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              required
            >
              <option value="">선택</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₩{p.unitPrice.toLocaleString()}/{p.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-500 mb-1">수량</label>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              required
            />
          </div>
          <div className="w-32 text-sm text-gray-700 py-2">
            ₩{((products.find((p) => p.id === item.productId)?.unitPrice || 0) * item.quantity).toLocaleString()}
          </div>
          {items.length > 1 && (
            <button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-sm py-2">
              삭제
            </button>
          )}
        </div>
      ))}

      <button type="button" onClick={addItem} className="text-blue-600 text-sm mb-4 hover:underline">
        + 품목 추가
      </button>

      <div className="mb-4">
        <label className="block text-xs text-gray-500 mb-1">비고</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm text-gray-900"
          rows={2}
        />
      </div>

      <div className="flex justify-between items-center">
        <p className="font-semibold text-gray-900">합계: ₩{totalAmount.toLocaleString()}</p>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {submitting ? "처리중..." : "발주 요청"}
        </button>
      </div>
    </form>
  );
}
