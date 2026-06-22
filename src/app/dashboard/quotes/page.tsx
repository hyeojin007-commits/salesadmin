"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

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
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
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

  const handleDeleteQuote = async (id: string, quoteNumber: string) => {
    if (!confirm(`견적서 "${quoteNumber}"을(를) 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/quotes?id=${id}`, { method: "DELETE" });
    if (res.ok) { setSelected(null); fetchQuotes(); }
    else { const data = await res.json(); alert(data.error || "삭제 실패"); }
  };

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
    if (validItems.length === 0 || !recipient.trim()) { setSubmitting(false); return; }

    await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient: recipient.trim(), projectName: projectName.trim(), items: validItems, note }),
    });

    setRecipient(""); setProjectName(""); setItems([{ productId: "", quantity: 1 }]); setNote("");
    setShowForm(false); setSubmitting(false); fetchQuotes();
  };

  const EMPTY_ROWS = 13;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">견적서</h1>
        {!selected && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
            {showForm ? "닫기" : "새 견적서 작성"}
          </button>
        )}
      </div>

      {showForm && !selected && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">견적서 작성</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">수신처</label>
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="예: 에스원" className="w-full border rounded px-3 py-2 text-sm text-gray-900" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">건명</label>
              <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="예: CCTV 견적" className="w-full border rounded px-3 py-2 text-sm text-gray-900" />
            </div>
          </div>
          <label className="block text-xs text-gray-500 mb-1">품목</label>
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-3 mb-3 items-end">
              <div className="flex-1">
                <select value={item.productId} onChange={(e) => updateItem(idx, "productId", e.target.value)} className="w-full border rounded px-3 py-2 text-sm text-gray-900" required>
                  <option value="">제품 선택</option>
                  {products.map((p) => (<option key={p.id} value={p.id}>{p.name} (₩{p.unitPrice.toLocaleString()}/{p.unit})</option>))}
                </select>
              </div>
              <div className="w-24">
                <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="w-full border rounded px-3 py-2 text-sm text-gray-900" required />
              </div>
              <div className="w-32 text-sm text-gray-700 py-2">₩{((products.find((p) => p.id === item.productId)?.unitPrice || 0) * item.quantity).toLocaleString()}</div>
              {items.length > 1 && (<button type="button" onClick={() => removeItem(idx)} className="text-red-500 text-sm py-2">삭제</button>)}
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-blue-600 text-sm mb-4 hover:underline">+ 품목 추가</button>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">비고</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="비고 사항을 입력하세요" className="w-full border rounded px-3 py-2 text-sm text-gray-900" rows={2} />
          </div>
          <div className="bg-gray-50 rounded p-3 mb-4 text-sm">
            <p className="font-bold text-gray-900 text-base">합계: ₩{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-400">* VAT 별도 / 기한: 견적일로부터 7일</p>
          </div>
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50">
            {submitting ? "생성 중..." : "견적서 생성"}
          </button>
        </form>
      )}

      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} className="text-blue-600 hover:underline text-sm mb-4 print:hidden">← 목록으로</button>

          <div className="bg-white shadow mx-auto print:shadow-none print:p-0" style={{ width: "210mm", padding: "15mm 20mm", fontFamily: "'굴림', 'Gulim', sans-serif", fontSize: "10pt", lineHeight: 1.4, color: "#000" }}>

            <div style={{ borderTop: "1px solid #000", borderLeft: "1px solid #000", borderRight: "1px solid #000", padding: "10px 0", textAlign: "center" }}>
              <span style={{ fontFamily: "'돋움', 'Dotum', sans-serif", fontSize: "36pt", fontWeight: "bold", letterSpacing: "0.3em" }}>
                견 적 서
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc", borderLeft: "1px solid #000", borderRight: "1px solid #000", padding: "4px 8px", fontSize: "10pt", color: "#000" }}>
              <span>견적 번호 : {selected.quoteNumber}</span>
              <span>견적일 : {formatQuoteDate(selected.createdAt)}</span>
            </div>

            <div style={{ display: "flex", borderLeft: "1px solid #000", borderRight: "1px solid #000", minHeight: "140px" }}>
              <div style={{ flex: 1, padding: "8px" }}>
                <div style={{ height: "24px" }}></div>
                <p style={{ fontSize: "16pt", fontWeight: "bold", marginBottom: "4px" }}>
                  {parseField(selected.order.note, "수신처")} 貴中
                </p>
                {parseField(selected.order.note, "건명") && (
                  <p style={{ fontSize: "11pt" }}>
                    건&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;명 : {parseField(selected.order.note, "건명")}
                  </p>
                )}
              </div>
              <div style={{ width: "260px", borderLeft: "1px solid #ccc", padding: "8px", fontSize: "9pt", lineHeight: 1.8, whiteSpace: "pre-line", color: "#000", position: "relative" }}>
                <p style={{ fontFamily: "'돋움체', 'DotumChe', monospace", fontSize: "14pt", fontWeight: "bold", marginBottom: "2px" }}>한화비전주식회사</p>
                <span>{`경기도 성남시 분당구 판교로319-6\n대표이사  김 기 철\n\n담  당 : ${selected.issuedBy.name}`}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/stamp.png" alt="직인" style={{ position: "absolute", top: "10px", right: "10px", width: "90px", height: "90px" }} />
              </div>
            </div>

            <div style={{ textAlign: "right", padding: "2px 8px", borderLeft: "1px solid #000", borderRight: "1px solid #000", fontSize: "10pt" }}>
              [단위 : 원]
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
              <thead>
                <tr>
                  <th style={thStyle({ width: "5%" })}>번호</th>
                  <th style={thStyle({ width: "30%" })}>규 격</th>
                  <th style={thStyle({ width: "14%" })}>품 명</th>
                  <th style={thStyle({ width: "5%" })}>단위</th>
                  <th style={thStyle({ width: "5%" })}>수량</th>
                  <th style={thStyle({ width: "11%" })}>단 가</th>
                  <th style={thStyle({ width: "15%" })}>금 액</th>
                  <th style={thStyle({ width: "15%" })}>비고</th>
                </tr>
              </thead>
              <tbody>
                {selected.order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={tdStyle({ textAlign: "center" })}>{idx + 1}</td>
                    <td style={tdStyle({ textAlign: "left", fontSize: "9pt" })}>{item.product.description || ""}</td>
                    <td style={tdStyle({ textAlign: "left", fontSize: "11pt" })}>{item.product.name}</td>
                    <td style={tdStyle({ textAlign: "center" })}>EA</td>
                    <td style={tdStyle({ textAlign: "right", fontSize: "11pt" })}>{item.quantity}</td>
                    <td style={tdStyle({ textAlign: "right", fontSize: "11pt" })}>{item.unitPrice.toLocaleString()}</td>
                    <td style={tdStyle({ textAlign: "right", fontSize: "11pt" })}>{item.amount.toLocaleString()}</td>
                    <td style={tdStyle({ textAlign: "center" })}></td>
                  </tr>
                ))}
                {selected.order.items.length < EMPTY_ROWS && (
                  <tr>
                    <td style={tdStyle({})}></td>
                    <td colSpan={2} style={{ ...tdStyle({}), textAlign: "right", color: "#999" }}>- 이 하 여 백 -</td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                  </tr>
                )}
                {Array.from({ length: Math.max(0, EMPTY_ROWS - selected.order.items.length - 1) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={tdStyle({})}>&nbsp;</td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                    <td style={tdStyle({})}></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ ...tdStyle({ fontWeight: "bold", textAlign: "center" }), borderTop: "2px solid #000" }}>
                    합&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;계
                  </td>
                  <td style={{ ...tdStyle({}), borderTop: "2px solid #000" }}></td>
                  <td style={{ ...tdStyle({}), borderTop: "2px solid #000" }}></td>
                  <td style={{ ...tdStyle({ fontWeight: "bold", textAlign: "right", fontSize: "11pt" }), borderTop: "2px solid #000" }}>
                    {selected.order.items.reduce((s, i) => s + i.quantity, 0)}
                  </td>
                  <td style={{ ...tdStyle({}), borderTop: "2px solid #000" }}></td>
                  <td style={{ ...tdStyle({ fontWeight: "bold", textAlign: "right", fontSize: "11pt" }), borderTop: "2px solid #000" }}>
                    {selected.totalAmount.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle({}), borderTop: "2px solid #000" }}></td>
                </tr>
              </tfoot>
            </table>

            <div style={{ borderLeft: "1px solid #000", padding: "6px 8px", fontSize: "10pt", lineHeight: 1.6 }}>
              <p>1. 납&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;기 : 발주(계약)후 6주</p>
              <p style={{ borderBottom: "1px solid #000", paddingBottom: "4px" }}>2. 유효기간 : 견적일로부터 7일</p>
              <p>3. 납품조건 : 협의</p>
              <p>4. 기타 납품조건 : 협의</p>
              <p>5. 하자보증(하자담보 무상보증) : 네트워크 제품 5년, 아날로그 제품 2년</p>
              {selected.note && <p>6. 비&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;고 : {selected.note}</p>}
            </div>
            <div style={{ borderLeft: "1px solid #000", borderBottom: "1px solid #000", padding: "4px 8px", fontSize: "10pt" }}>
              <p>※ 상기 견적은 VAT 별도 견적입니다.</p>
            </div>

            <div className="print:hidden" style={{ marginTop: "12px", fontSize: "9pt", color: "#999" }}>
              작성자: {selected.issuedBy.name} | 생성일시: {new Date(selected.createdAt).toLocaleString("ko-KR")}
            </div>

            <div className="print:hidden" style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                인쇄 / PDF 저장
              </button>
              {isAdmin && (
                <button onClick={() => handleDeleteQuote(selected.id, selected.quoteNumber)} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                  견적서 삭제
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
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
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(q.createdAt).toLocaleString("ko-KR")}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => setSelected(q)} className="text-blue-600 hover:underline text-sm">상세보기</button>
                    {isAdmin && <button onClick={() => handleDeleteQuote(q.id, q.quoteNumber)} className="text-red-600 hover:underline text-sm">삭제</button>}
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">견적서가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function thStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    border: "1px solid #000",
    padding: "6px 4px",
    textAlign: "center",
    fontWeight: "normal",
    backgroundColor: "#fff",
    ...extra,
  };
}

function tdStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    border: "1px solid #000",
    padding: "4px 4px",
    verticalAlign: "middle",
    ...extra,
  };
}
