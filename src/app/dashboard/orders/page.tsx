"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import OrderForm from "@/components/OrderForm";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  product: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  note?: string;
  createdAt: string;
  requester: { name: string; company?: string; role: string };
  processedBy?: { name: string };
  items: OrderItem[];
  quote?: { quoteNumber: string };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "대기중",
  CONFIRMED: "승인",
  REJECTED: "거절",
  QUOTED: "견적완료",
  COMPLETED: "완료",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  QUOTED: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

export default function OrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showForm, setShowForm] = useState(false);

  const fetchOrders = () => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    fetchOrders();
  };

  const role = session?.user?.role;
  const canProcess = role === "ADMIN" || role === "SALES";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">발주 관리</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
        >
          {showForm ? "닫기" : "새 발주 요청"}
        </button>
      </div>

      {showForm && (
        <OrderForm
          onSuccess={() => {
            setShowForm(false);
            fetchOrders();
          }}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">발주번호</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청처</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">품목</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">금액</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">일자</th>
              {canProcess && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">처리</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-4 py-3 text-sm text-gray-900 font-mono">{order.orderNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {order.requester.company} ({order.requester.name})
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {order.items.map((i) => `${i.product.name} x${i.quantity}`).join(", ")}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">₩{order.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("ko-KR")}
                </td>
                {canProcess && (
                  <td className="px-4 py-3 text-sm space-x-1">
                    {order.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, "CONFIRMED")}
                          className="text-green-600 hover:underline text-xs"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, "REJECTED")}
                          className="text-red-600 hover:underline text-xs"
                        >
                          거절
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  발주 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
