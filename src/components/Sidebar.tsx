"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  SALES: "영업팀",
  DISTRIBUTOR: "총판",
  DEALER: "대리점",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const links = [
    { href: "/dashboard", label: "대시보드", roles: ["ADMIN", "SALES", "DISTRIBUTOR", "DEALER"] },
    { href: "/dashboard/orders", label: "발주 관리", roles: ["ADMIN", "SALES", "DISTRIBUTOR", "DEALER"] },
    { href: "/dashboard/products", label: "제품 관리", roles: ["ADMIN", "SALES"] },
    { href: "/dashboard/quotes", label: "견적서 조회", roles: ["ADMIN", "SALES", "DISTRIBUTOR", "DEALER"] },
    { href: "/dashboard/users", label: "사용자 관리", roles: ["ADMIN"] },
  ];

  const filteredLinks = links.filter((l) => role && l.roles.includes(role));

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">발주 관리 시스템</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {filteredLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-3 py-2 rounded text-sm ${
              pathname === link.href ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {session?.user && (
        <div className="p-4 border-t border-gray-700 text-sm">
          <p className="font-medium">{session.user.name}</p>
          <p className="text-gray-400 text-xs">
            {session.user.company} · {ROLE_LABELS[session.user.role] || session.user.role}
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 text-gray-400 hover:text-white text-xs"
          >
            로그아웃
          </button>
        </div>
      )}
    </aside>
  );
}
