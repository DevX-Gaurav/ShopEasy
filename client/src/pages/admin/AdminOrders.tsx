import { useState } from "react";
import { useStore } from "@/lib/useStore";
import type { Order } from "@/lib/types";
import { formatDateTime, formatINR } from "@/lib/format";
import { statusColor } from "@/lib/orders";
import { cn } from "@/lib/utils";

export default function AdminOrders() {
  const [orders] = useStore<Order[]>("orders", []);
  const [filter, setFilter] = useState("all");
  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">All orders ({orders.length})</h2>
          <p className="text-sm text-muted-foreground">Platform-wide order log.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="all">All statuses</option>
          {["Placed", "Dispatched", "Shipped", "Out for Delivery", "Delivered", "Cancelled"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Order</th>
                <th className="px-3 py-3 text-left">Customer</th>
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-3 font-mono text-xs font-bold">{o.id}</td>
                  <td className="px-3 py-3">{o.customerName}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                  <td className="px-3 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusColor(o.status))}>{o.status}</span></td>
                  <td className="px-3 py-3 text-right font-semibold">{formatINR(o.total)}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No orders.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}