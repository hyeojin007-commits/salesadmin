import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SALES"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const products = [];
  for (const row of rows) {
    const name = String(row["제품명"] || "").trim();
    if (!name) continue;
    const unitPrice = Number(row["단가"]) || 0;
    const unit = String(row["단위"] || "EA").trim();
    const category = String(row["카테고리"] || "").trim();
    const description = String(row["설명"] || "").trim();
    products.push({ name, unitPrice, unit, category, description });
  }

  if (products.length === 0) {
    return NextResponse.json({ error: "유효한 제품 데이터가 없습니다." }, { status: 400 });
  }

  let created = 0;
  for (const p of products) {
    await prisma.product.create({ data: p });
    created++;
  }

  return NextResponse.json({ message: `${created}개 제품이 등록되었습니다.`, created });
}
