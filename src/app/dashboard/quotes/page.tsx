"use client";

import { useEffect, useState } from "react";

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
    requester: { name: string; company?: string; role: string };
    items: Array<{
      quantity: number;
      unitPrice: number;
      amount: number;
      product: { name: string };
    }>;
  };
}

const ROLE_LABELS: Record<string, string> = {
  DISTRIBUTOR: "총판",
  DEALER: "대리점",
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState<Quote | null>(null);

  useEffect(() => {
    fetch("/api/quotes").then((r) => r.json()).then(setQuotes);
  }, []);

  const handlePrint = () => window.print();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">견적서 조회</h1>

      {selected ? (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="text-blue-600 hover:underline text-sm mb-4"
          >
            ← 목록으로
          </button>

          <div id="quote-detail" className="bg-white rounded-lg shadow p-8 max-w-3xl print:shadow-none">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">견 적 서</h2>
              <p className="text-sm text-gray-500 mt-1">{selected.quoteNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">발주처</p>
                <p className="font-medium text-gray-900">
                  {selected.order.requester.company} ({ROLE_LABELS[selected.order.requester.role] || selected.order.requester.role})
                </p>
                <p className="text-gray-700">담당: {selected.order.requester.name}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">발행일</p>
                <p className="text-gray-900">{new Date(selected.createdAt).toLocaleDateString("ko-KR")}</p>
                <p className="text-gray-500 mt-2">유효기간</p>
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

            <div className="mt-6 text-sm text-gray-500">
              <p>발행자: {selected.issuedBy.name}</p>
              <p>발주번호: {selected.order.orderNumber}</p>
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">견적번호</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">발주처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">합계</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">발행자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">발행일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 font-mono">{q.quoteNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{q.order.requester.company}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{q.order.requester.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">₩{q.grandTotal.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{q.issuedBy.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(q.createdAt).toLocaleDateString("ko-KR")}
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
                    견적서가 없습니다.
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
