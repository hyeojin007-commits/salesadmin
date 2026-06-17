import { format } from "date-fns";

export function generateOrderNumber(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${random}`;
}

export function generateQuoteNumber(): string {
  const date = format(new Date(), "yyyyMMdd");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `QT-${date}-${random}`;
}
