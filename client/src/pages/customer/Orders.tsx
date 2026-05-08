import { Link } from "react-router-dom";
import { useStore } from "@/lib/useStore";
import type { Order } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatINR } from "@/lib/format";
import { ChevronRight, Package } from "lucide-react";
import { statusColor } from "@/lib/orders";
import { cn } from "@/lib/utils";

export default function Orders() {
  const { user } = useAuth();
  const [orders] = useStore<Order[]>("orders", []);
  const mine = orders.filter((o) => o.customerId === user?.id);

  if (mine.length === 0) {
    return (
      <div className="container py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-bold">No orders yet</h1>
        <p className="mt-1 text-muted-foreground">Start exploring the marketplace.</p>
        <Button asChild className="mt-6"><Link to="/shop">Browse products</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">{mine.length} order(s)</p>
      <div className="mt-6 space-y-3">
        {mine.map((o) => (
          <Link
            key={o.id}
            to={`/orders/${o.id}`}
            className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((it, i) => (
                <div key={i} className="h-14 w-14 overflow-hidden rounded-lg border-2 border-background bg-muted">
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-mono text-sm font-bold">{o.id}</div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusColor(o.status))}>
                  {o.status}
                </span>
              </div>
              <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                {o.items.map((i) => i.name).join(", ")}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(o.createdAt)} · {o.items.length} item(s)
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{formatINR(o.total)}</div>
              <div className="mt-1 text-xs text-muted-foreground">{o.paymentMethod}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}