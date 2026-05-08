import { Link, useParams } from "react-router-dom";
import { useStore } from "@/lib/useStore";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package } from "lucide-react";
import { formatINR } from "@/lib/format";

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>();
  const [orders] = useStore<Order[]>("orders", []);
  const order = orders.find((o) => o.id === id);

  return (
    <div className="container max-w-xl py-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="h-10 w-10 text-success" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Order placed!</h1>
      <p className="mt-2 text-muted-foreground">Thanks for shopping with ShopEasy. We'll send updates as your order moves.</p>

      {order && (
        <div className="mt-8 rounded-2xl border bg-card p-6 text-left shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Order ID</div>
              <div className="font-mono font-bold">{order.id}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
              <div className="text-lg font-bold">{formatINR(order.total)}</div>
            </div>
          </div>
          <div className="mt-4 border-t pt-4 text-sm text-muted-foreground">
            <div>{order.items.length} item(s) · {order.paymentMethod}</div>
            <div className="mt-1">Shipping to: {order.shippingAddress}</div>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Button asChild variant="outline"><Link to="/shop">Continue shopping</Link></Button>
        <Button asChild variant="hero"><Link to={`/orders/${id}`}><Package className="h-4 w-4" /> Track order</Link></Button>
      </div>
    </div>
  );
}