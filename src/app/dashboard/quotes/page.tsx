"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  description?: string;
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
      product: { name: string; description?: string };
    }>;
  };
}

interface OrderItem {
  productId: string;
  quantity: number;
}

function parseField(note: string | undefined, field: string): string {
  if (!note) return "";
  const match = note.match(new RegExp(`${field}: (.+?)(\n|$)`));
  return match ? match[1] : "";
}

function formatQuoteDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [projectName, setProjectName] = useState("");
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
      body: JSON.stringify({
        recipient: recipient.trim(),
        projectName: projectName.trim(),
        items: validItems,
        note,
      }),
    });

    setRecipient("");
    setProjectName("");
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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">수신처</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="예: 에스원"
                className="w-full border rounded px-3 py-2 text-sm text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">건명</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="예: CCTV 견적"
                className="w-full border rounded px-3 py-2 text-sm text-gray-900"
              />
            </div>
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
            <p className="font-bold text-gray-900 text-base">합계: ₩{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">* VAT 별도 / 기한: 견적일로부터 7일</p>
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

      {/* 견적서 상세 (엑셀 양식) */}
      {selected ? (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="text-blue-600 hover:underline text-sm mb-4 print:hidden"
          >
            ← 목록으로
          </button>

          <div className="bg-white rounded-lg shadow p-10 max-w-4xl mx-auto print:shadow-none print:p-0" style={{ fontFamily: "'Malgun Gothic', '맑은 고딕', '굴림', sans-serif" }}>
            {/* 제목 */}
            <h2 className="text-center text-4xl font-bold tracking-[0.3em] mb-2" style={{ fontFamily: "'돋움', sans-serif" }}>
              견 적 서
            </h2>

            {/* 견적번호 + 견적일 */}
            <div className="flex justify-between text-sm mb-4">
              <span>견적 번호 : {selected.quoteNumber}</span>
              <span>견적일 : {formatQuoteDate(selected.createdAt)}</span>
            </div>

            {/* 수신처 + 공급자 */}
            <div className="flex justify-between mb-1">
              <div className="flex-1">
                <p className="text-lg font-bold mb-1">
                  {parseField(selected.order.note, "수신처")} 貴中
                </p>
                {parseField(selected.order.note, "건명") && (
                  <p className="text-sm">건&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명 : {parseField(selected.order.note, "건명")}</p>
                )}
              </div>
              <div className="border border-gray-400 p-3 text-xs leading-6 w-64">
                <p className="font-bold text-sm mb-1">한화비전주식회사</p>
                <p>경기도 성남시 분당구 판교로319-6</p>
                <p>대표이사 김 기 철</p>
                <p className="mt-1">담&nbsp;&nbsp;당 : {selected.issuedBy.name}</p>
              </div>
            </div>

            {/* 단위 */}
            <div className="text-right text-xs text-gray-600 mb-0">[단위 : 원]</div>

            {/* 품목 테이블 */}
            <table className="w-full border-collapse text-sm mb-0">
              <thead>
                <tr className="border-t-2 border-b border-gray-900 bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-center w-10">번호</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">규 격</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">품 명</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-14">단위</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-14">수량</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-24">단 가</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-28">금 액</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-16">비고</th>
                </tr>
              </thead>
              <tbody>
                {selected.order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">{idx + 1}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-left text-xs">{item.product.description || ""}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-left">{item.product.name}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center">EA</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right">{item.quantity}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right">{item.unitPrice.toLocaleString()}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-right">{item.amount.toLocaleString()}</td>
                    <td className="border border-gray-300 px-2 py-1.5 text-center"></td>
                  </tr>
                ))}
                {/* 이하여백 */}
                {selected.order.items.length < 13 && (
                  <tr>
                    <td className="border border-gray-300 px-2 py-1.5" colSpan={8}>
                      <p className="text-center text-xs text-gray-400">- 이 하 여 백 -</p>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-900 font-bold">
                  <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>합&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;계</td>
                  <td className="border border-gray-300 px-2 py-2"></td>
                  <td className="border border-gray-300 px-2 py-2"></td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {selected.order.items.reduce((s, i) => s + i.quantity, 0)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2"></td>
                  <td className="border border-gray-300 px-2 py-2 text-right">
                    {selected.totalAmount.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-2 py-2"></td>
                </tr>
              </tfoot>
            </table>

            {/* 하단 조건 */}
            <div className="mt-4 text-sm space-y-0.5">
              <p>1. 납&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;기 : 발주(계약)후 6주</p>
              <p>2. 유효기간 : 견적일로부터 7일</p>
              <p>3. 납품조건 : 협의</p>
              {selected.note && <p>4. 비&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;고 : {selected.note}</p>}
            </div>

            <p className="mt-4 text-sm font-medium">※ 상기 견적은 VAT 별도 견적입니다.</p>

            {/* 메타 정보 */}
            <div className="mt-4 pt-3 border-t text-xs text-gray-400 space-y-0.5 print:hidden">
              <p>작성자: {selected.issuedBy.name} | 생성일시: {new Date(selected.createdAt).toLocaleString("ko-KR")}</p>
            </div>

            {/* 인쇄 버튼 */}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">건명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">합계</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{q.quoteNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{parseField(q.order.note, "수신처")}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{parseField(q.order.note, "건명") || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">₩{q.totalAmount.toLocaleString()}</td>
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
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
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
