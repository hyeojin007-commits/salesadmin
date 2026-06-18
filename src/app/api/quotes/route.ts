import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, generateQuoteNumber } from "@/lib/quote-number";
import { addDays } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quotes = await prisma.quote.findMany({
    include: {
      order: {
        include: {
          requester: { select: { name: true, company: true, role: true } },
          items: { include: { product: true } },
        },
      },
      issuedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(quotes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { recipient, projectName, items, note } = body as {
    recipient: string;
    projectName?: string;
    items: { productId: string; quantity: number }[];
    note?: string;
  };

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
  const tax = totalAmount * 0.1;
  const now = new Date();

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      requesterId: session.user.id,
      status: "QUOTED",
      note: `수신처: ${recipient}${projectName ? `\n건명: ${projectName}` : ""}${note ? `\n비고: ${note}` : ""}`,
      totalAmount,
      items: { create: orderItems },
    },
  });

  const quote = await prisma.quote.create({
    data: {
      quoteNumber: generateQuoteNumber(),
      orderId: order.id,
      issuedById: session.user.id,
      totalAmount,
      tax,
      grandTotal: totalAmount + tax,
      validUntil: addDays(now, 7),
      note: note || null,
    },
    include: {
      order: {
        include: {
          requester: { select: { name: true, company: true } },
          items: { include: { product: true } },
        },
      },
      issuedBy: { select: { name: true } },
    },
  });

  return NextResponse.json(quote, { status: 201 });
}
