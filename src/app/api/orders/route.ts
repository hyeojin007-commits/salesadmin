import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, generateQuoteNumber } from "@/lib/quote-number";
import { addDays } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    session.user.role === "ADMIN" || session.user.role === "SALES"
      ? {}
      : { requesterId: session.user.id };

  const orders = await prisma.order.findMany({
    where,
    include: {
      requester: { select: { id: true, name: true, company: true, role: true } },
      processedBy: { select: { id: true, name: true } },
      items: { include: { product: true } },
      quote: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const items = body.items as { productId: string; quantity: number }[];

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });

  const orderItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      amount: product.unitPrice * item.quantity,
    };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.amount, 0);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      requesterId: session.user.id,
      note: body.note,
      totalAmount,
      items: { create: orderItems },
    },
    include: {
      requester: { select: { id: true, name: true, company: true } },
      items: { include: { product: true } },
    },
  });

  return NextResponse.json(order, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SALES"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { orderId, status } = body;

  const updateData: Record<string, unknown> = {
    status,
    processedById: session.user.id,
  };

  const order = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      requester: { select: { id: true, name: true, company: true } },
      items: { include: { product: true } },
    },
  });

  if (status === "CONFIRMED") {
    const tax = order.totalAmount * 0.1;
    await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        orderId: order.id,
        issuedById: session.user.id,
        totalAmount: order.totalAmount,
        tax,
        grandTotal: order.totalAmount + tax,
        validUntil: addDays(new Date(), 30),
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: "QUOTED" },
    });
  }

  const updated = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      requester: { select: { id: true, name: true, company: true, role: true } },
      processedBy: { select: { id: true, name: true } },
      items: { include: { product: true } },
      quote: { include: { issuedBy: { select: { name: true } } } },
    },
  });

  return NextResponse.json(updated);
}
