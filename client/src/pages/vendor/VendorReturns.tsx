import { useStore } from "@/lib/useStore";
import type { Order } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { restockOrder } from "@/lib/orders";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { Link } from "react-router-dom";

export default function VendorReturns() {
  const { user } = useAuth();
  const [orders, setOrders] = useStore<Order[]>("orders", []);
  const myReturns = orders.filter(
    (o) => o.returnRequest && o.items.some((i) => i.vendorId === user?.id),
  );

  const update = (orderId: string, status: "Approved" | "Rejected" | "Refunded") => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.returnRequest) return;
    setOrders(
      orders.map((o) =>
        o.id === orderId
          ? { ...o, returnRequest: { ...o.returnRequest!, status }, updatedAt: new Date().toISOString() }
          : o,
      ),
    );
    if (status === "Approved" || status === "Refunded") restockOrder(order);
    toast.success(`Return ${status.toLowerCase()}`);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Return requests ({myReturns.length})</h2>
        <p className="text-sm text-muted-foreground">Review customer returns within your shop.</p>
      </div>

      <div className="space-y-3">
        {myReturns.map((o) => (
          <div key={o.id} className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{o.returnRequest!.id}</div>
                <Link to={`/vendor/orders/${o.id}`} className="font-mono text-sm font-bold hover:text-primary">{o.id}</Link>
                <div className="mt-1 text-xs text-muted-foreground">From {o.customerName} · {formatDateTime(o.returnRequest!.createdAt)}</div>
              </div>
              <span className="rounded-full bg-warning/15 px-3 py-1 text-xs font-semibold text-warning">{o.returnRequest!.status}</span>
            </div>
            <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{o.returnRequest!.reason}</div>
            {o.returnRequest!.status === "Pending" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => update(o.id, "Approved")}><Check className="h-4 w-4" /> Approve</Button>
                <Button size="sm" variant="outline" onClick={() => update(o.id, "Rejected")}><X className="h-4 w-4" /> Reject</Button>
              </div>
            )}
            {o.returnRequest!.status === "Approved" && (
              <Button size="sm" className="mt-3" onClick={() => update(o.id, "Refunded")}>Mark refunded</Button>
            )}
          </div>
        ))}
        {myReturns.length === 0 && (
          <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">No return requests.</div>
        )}
      </div>
    </div>
  );
}