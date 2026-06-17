"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  totalAmount: number;
  tax: number;
  grandTotal: number;
  validUntil: string;
  createdAt: string;
  note?: string;
  issuedBy: { name: string };
  order: {
    orderNumber: string;
    note?: string;
    requester: { name: string; company?: string; role: string };
    items: Array<{
      quantity: number;
      unitPrice: number;
      amount: number;
      product: { name: string };
    }>;
  };
}

interface OrderItem {
  productId: string;
  quantity: number;
}

function formatIssueDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월`;
}

function parseRecipient(note?: string) {
  if (!note) return "-";
  const match = note.match(/수신처: (.+?)(\n|$)/);
  return match ? match[1] : "-";
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ productId: "", quantity: 1 }]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchQuotes = () => fetch("/api/quotes").then((r) => r.json()).then(setQuotes);

  useEffect(() => {
    fetchQuotes();
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
    if (validItems.length === 0 || !recipient.trim()) {
      setSubmitting(false);
      return;
    }

    await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: recipient.trim(), items: validItems, note }),
    });

    setRecipient("");
    setItems([{ productId: "", quantity: 1 }]);
    setNote("");
    setShowForm(false);
    setSubmitting(false);
    fetchQuotes();
  };

  const handlePrint = () => window.print();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">견적서</h1>
        {!selected && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            {showForm ? "닫기" : "새 견적서 작성"}
          </button>
        )}
      </div>

      {/* 견적서 작성 폼 */}
      {showForm && !selected && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">견적서 작성</h2>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">수신처</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="수신처를 입력하세요"
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              required
            />
          </div>

          <label className="block text-xs text-gray-500 mb-1">품목</label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 mb-3 items-end">
              <div className="flex-1">
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(idx, "productId", e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                  required
                >
                  <option value="">제품 선택</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₩{p.unitPrice.toLocaleString()}/{p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
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
              placeholder="비고 사항을 입력하세요"
              className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              rows={2}
            />
          </div>

          <div className="bg-gray-50 rounded p-3 mb-4 text-sm text-gray-600 space-y-1">
            <p>공급가: ₩{totalAmount.toLocaleString()}</p>
            <p>부가세 (10%): ₩{(totalAmount * 0.1).toLocaleString()}</p>
            <p className="font-bold text-gray-900 text-base">합계: ₩{(totalAmount * 1.1).toLocaleString()}</p>
            <p className="text-xs text-gray-400">* 기한: 발행일로부터 7일 / 발행일: 자동 설정</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "견적서 생성"}
          </button>
        </form>
      )}

      {/* 견적서 상세 보기 */}
      {selected ? (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="text-blue-600 hover:underline text-sm mb-4"
          >
            ← 목록으로
          </button>

          <div className="bg-white rounded-lg shadow p-8 max-w-3xl print:shadow-none">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">견 적 서</h2>
              <p className="text-sm text-gray-500 mt-1">{selected.quoteNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">수신처</p>
                <p className="font-medium text-gray-900">{parseRecipient(selected.order.note)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">발행일</p>
                <p className="text-gray-900">{formatIssueDate(selected.createdAt)}</p>
                <p className="text-gray-500 mt-2">기한</p>
                <p className="text-gray-900">{new Date(selected.validUntil).toLocaleDateString("ko-KR")}</p>
              </div>
            </div>

            <table className="w-full mb-6 text-sm">
              <thead>
                <tr className="border-y-2 border-gray-900">
                  <th className="py-2 text-left">품목</th>
                  <th className="py-2 text-right">단가</th>
                  <th className="py-2 text-right">수량</th>
                  <th className="py-2 text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                {selected.order.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 text-gray-900">{item.product.name}</td>
                    <td className="py-2 text-right text-gray-900">₩{item.unitPrice.toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-900">{item.quantity}</td>
                    <td className="py-2 text-right text-gray-900">₩{item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t-2 border-gray-900 pt-4 text-sm space-y-1 text-right">
              <p className="text-gray-700">공급가: ₩{selected.totalAmount.toLocaleString()}</p>
              <p className="text-gray-700">부가세 (10%): ₩{selected.tax.toLocaleString()}</p>
              <p className="text-lg font-bold text-gray-900">합계: ₩{selected.grandTotal.toLocaleString()}</p>
            </div>

            <div className="mt-6 text-sm text-gray-500 space-y-1">
              <p>작성자: {selected.issuedBy.name}</p>
              <p>생성일시: {new Date(selected.createdAt).toLocaleString("ko-KR")}</p>
              {selected.note && <p>비고: {selected.note}</p>}
            </div>

            <div className="mt-6 flex gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                인쇄 / PDF 저장
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 견적서 목록 */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">견적번호</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">수신처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">합계</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">발행일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">기한</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{q.quoteNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{parseRecipient(q.order.note)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">₩{q.grandTotal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatIssueDate(q.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(q.validUntil).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{q.issuedBy.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(q.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(q)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      상세보기
                    </button>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    견적서가 없습니다. "새 견적서 작성" 버튼으로 생성해보세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
