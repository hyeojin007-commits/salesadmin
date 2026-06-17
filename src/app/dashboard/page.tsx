"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  quotedOrders: number;
  totalAmount: number;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  SALES: "영업팀",
  DISTRIBUTOR: "총판",
  DEALER: "대리점",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, quotedOrders: 0, totalAmount: 0 });

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((orders: Array<{ status: string; totalAmount: number }>) => {
        setStats({
          totalOrders: orders.length,
          pendingOrders: orders.filter((o) => o.status === "PENDING").length,
          quotedOrders: orders.filter((o) => o.status === "QUOTED").length,
          totalAmount: orders.reduce((s, o) => s + o.totalAmount, 0),
        });
      });
  }, []);

  const cards = [
    { label: "전체 발주", value: stats.totalOrders },
    { label: "대기중", value: stats.pendingOrders },
    { label: "견적 완료", value: stats.quotedOrders },
    { label: "총 금액", value: `₩${stats.totalAmount.toLocaleString()}` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        안녕하세요, {session?.user?.name}님 ({ROLE_LABELS[session?.user?.role || ""] || ""})
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
