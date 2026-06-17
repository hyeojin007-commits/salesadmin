import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  return seed();
}

export async function POST() {
  return seed();
}

async function seed() {
  const password = await bcrypt.hash("admin1234", 12);

  await prisma.user.upsert({
    where: { email: "admin@sales.com" },
    update: {},
    create: {
      email: "admin@sales.com",
      name: "관리자",
      password,
      role: "ADMIN",
      company: "본사",
    },
  });

  await prisma.user.upsert({
    where: { email: "sales@sales.com" },
    update: {},
    create: {
      email: "sales@sales.com",
      name: "영업팀장",
      password,
      role: "SALES",
      company: "본사",
    },
  });

  await prisma.user.upsert({
    where: { email: "dist@sales.com" },
    update: {},
    create: {
      email: "dist@sales.com",
      name: "총판담당자",
      password,
      role: "DISTRIBUTOR",
      company: "A총판",
    },
  });

  await prisma.user.upsert({
    where: { email: "dealer@sales.com" },
    update: {},
    create: {
      email: "dealer@sales.com",
      name: "대리점담당자",
      password,
      role: "DEALER",
      company: "B대리점",
    },
  });

  const products = [
    { name: "노트북 Pro 15", unitPrice: 1500000, category: "전자기기", unit: "대" },
    { name: "무선 마우스 M100", unitPrice: 35000, category: "주변기기", unit: "개" },
    { name: "모니터 27인치 4K", unitPrice: 450000, category: "전자기기", unit: "대" },
    { name: "키보드 기계식 K200", unitPrice: 89000, category: "주변기기", unit: "개" },
    { name: "USB-C 허브 7포트", unitPrice: 55000, category: "주변기기", unit: "개" },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }

  return NextResponse.json({ message: "Seed completed" });
}
