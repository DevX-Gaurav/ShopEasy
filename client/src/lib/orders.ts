import { KEYS, readKey, writeKey } from "./storage";
import type { Order, OrderStatus, Product } from "./types";

export const ORDER_FLOW: OrderStatus[] = [
  "Placed",
  "Dispatched",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

export function nextStatus(s: OrderStatus): OrderStatus | null {
  const i = ORDER_FLOW.indexOf(s);
  if (i < 0 || i >= ORDER_FLOW.length - 1) return null;
  return ORDER_FLOW[i + 1];
}

export function deliveredWithinDays(o: Order, days: number) {
  if (o.status !== "Delivered") return false;
  const updated = new Date(o.updatedAt).getTime();
  return Date.now() - updated <= days * 24 * 60 * 60 * 1000;
}

export function canCustomerCancel(o: Order) {
  return (
    o.status === "Placed" || o.status === "Dispatched" || o.status === "Shipped"
  );
}

export function canVendorCancel(o: Order) {
  return o.status === "Placed" || o.status === "Dispatched";
}

export function canRequestReturn(o: Order) {
  return (
    o.status === "Delivered" && !o.returnRequest && deliveredWithinDays(o, 7)
  );
}

export function updateOrder(orderId: string, patch: Partial<Order>) {
  const orders = readKey<Order[]>(KEYS.orders, []);
  const next = orders.map((o) =>
    o.id === orderId
      ? { ...o, ...patch, updatedAt: new Date().toISOString() }
      : o,
  );
  writeKey(KEYS.orders, next);
}

/** Restock items (e.g. on cancel/return-approved). */
export function restockOrder(o: Order) {
  const products = readKey<Product[]>(KEYS.products, []);
  const next = products.map((p) => {
    const it = o.items.find((i) => i.productId === p.id);
    if (!it) return p;
    return { ...p, stock: p.stock + it.quantity };
  });
  writeKey(KEYS.products, next);
}

/** Decrement stock (on order placement). */
export function decrementStock(items: Order["items"]) {
  const products = readKey<Product[]>(KEYS.products, []);
  const next = products.map((p) => {
    const it = items.find((i) => i.productId === p.id);
    if (!it) return p;
    return { ...p, stock: Math.max(0, p.stock - it.quantity) };
  });
  writeKey(KEYS.products, next);
}

export function statusColor(s: OrderStatus): string {
  switch (s) {
    case "Placed":
      return "bg-muted text-foreground";
    case "Dispatched":
      return "bg-warning/15 text-warning";
    case "Shipped":
      return "bg-primary/10 text-primary";
    case "Out for Delivery":
      return "bg-primary/20 text-primary-deep";
    case "Delivered":
      return "bg-success/15 text-success";
    case "Cancelled":
      return "bg-destructive/10 text-destructive";
  }
}
