import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, company: true, phone: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const hashedPassword = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      password: hashedPassword,
      role: body.role,
      company: body.company,
      phone: body.phone,
    },
    select: { id: true, email: true, name: true, role: true, company: true },
  });
  return NextResponse.json(user, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (id === session.user.id) return NextResponse.json({ error: "자기 자신은 삭제할 수 없습니다." }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ message: "Deleted" });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, newPassword } = body as { id: string; newPassword: string };

  if (!id || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (newPassword.length < 6) return NextResponse.json({ error: "비밀번호는 6자 이상이어야 합니다." }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { password: hashed } });

  return NextResponse.json({ message: "비밀번호가 변경되었습니다." });
}
