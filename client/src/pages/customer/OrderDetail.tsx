import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "@/lib/useStore";
import type { Order, ReturnRequest } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatINR } from "@/lib/format";
import { canCustomerCancel, canRequestReturn, ORDER_FLOW, restockOrder, statusColor } from "@/lib/orders";
import { Check, Truck, Package, Home, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [orders, setOrders] = useStore<Order[]>("orders", []);
  const order = orders.find((o) => o.id === id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!order || order.customerId !== user?.id) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Order not found</h1>
        <Button asChild className="mt-4"><Link to="/orders">Back to orders</Link></Button>
      </div>
    );
  }

  const cancelOrder = () => {
    if (!reason.trim()) return toast.error("Please provide a reason");
    setOrders(
      orders.map((o) =>
        o.id === order.id
          ? { ...o, status: "Cancelled", cancelReason: reason.trim(), cancelledBy: "customer", updatedAt: new Date().toISOString() }
          : o,
      ),
    );
    restockOrder(order);
    toast.success("Order cancelled");
    setCancelOpen(false);
    setReason("");
  };

  const requestReturn = () => {
    if (!reason.trim()) return toast.error("Please provide a reason");
    const rr: ReturnRequest = {
      id: `RET-${Date.now().toString(36).toUpperCase()}`,
      reason: reason.trim(),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    setOrders(
      orders.map((o) =>
        o.id === order.id ? { ...o, returnRequest: rr, updatedAt: new Date().toISOString() } : o,
      ),
    );
    toast.success("Return request submitted");
    setReturnOpen(false);
    setReason("");
  };

  const stepIcons = [Check, Package, Truck, Truck, Home];

  return (
    <div className="container py-8 sm:py-10">
      <Link to="/orders" className="text-sm text-muted-foreground hover:text-foreground">← Back to orders</Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{order.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", statusColor(order.status))}>
          {order.status}
        </span>
      </div>

      {/* Tracker */}
      {order.status !== "Cancelled" && (
        <div className="mt-8 rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold">Order timeline</h2>
          <ol className="mt-5 grid gap-4 sm:grid-cols-5">
            {ORDER_FLOW.map((step, i) => {
              const currIdx = ORDER_FLOW.indexOf(order.status);
              const reached = i <= currIdx;
              const Icon = stepIcons[i];
              return (
                <li key={step} className="relative">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border-2", reached ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className={cn("mt-2 text-xs font-medium", reached ? "text-foreground" : "text-muted-foreground")}>{step}</div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {order.status === "Cancelled" && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="font-semibold text-destructive">Order cancelled by {order.cancelledBy}</div>
          {order.cancelReason && <div className="mt-1 text-muted-foreground">Reason: {order.cancelReason}</div>}
        </div>
      )}

      {order.returnRequest && (
        <div className="mt-4 rounded-2xl border bg-accent/40 p-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Return request — {order.returnRequest.id}</div>
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusColor("Placed"))}>
              {order.returnRequest.status}
            </span>
          </div>
          <div className="mt-1 text-muted-foreground">Reason: {order.returnRequest.reason}</div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Items</h2>
          <ul className="mt-4 divide-y">
            {order.items.map((it, i) => (
              <li key={i} className="flex items-center gap-4 py-3">
                <Link to={`/product/${it.productId}`} className="h-16 w-16 overflow-hidden rounded-md bg-muted">
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex-1">
                  <Link to={`/product/${it.productId}`} className="line-clamp-1 font-medium hover:text-primary">{it.name}</Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Qty {it.quantity}{" "}
                    {[it.selectedColor, it.selectedSize].filter(Boolean).length > 0 && `· ${[it.selectedColor, it.selectedSize].filter(Boolean).join(" · ")}`}
                  </div>
                </div>
                <div className="font-semibold">{formatINR(it.price * it.quantity)}</div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold">Summary</h3>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatINR(order.subtotal)} />
              <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatINR(order.shipping)} />
              <div className="my-2 border-t" />
              <Row label="Total" value={formatINR(order.total)} bold />
              <Row label="Payment" value={order.paymentMethod} />
            </dl>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold">Shipping to</h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{order.customerName}</div>
              <div>{order.shippingAddress}</div>
              <div className="mt-1">{order.customerPhone} · {order.customerEmail}</div>
            </div>
          </div>

          <div className="space-y-2">
            {canCustomerCancel(order) && (
              <Button onClick={() => setCancelOpen(true)} variant="outline" className="w-full">
                <X className="h-4 w-4" /> Cancel order
              </Button>
            )}
            {canRequestReturn(order) && (
              <Button onClick={() => setReturnOpen(true)} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4" /> Request return
              </Button>
            )}
          </div>
        </aside>
      </div>

      <ReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this order?"
        description="Tell us why so we can improve."
        onConfirm={cancelOrder}
        reason={reason}
        setReason={setReason}
        confirmLabel="Cancel order"
        destructive
      />
      <ReasonDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        title="Request a return"
        description="Returns are accepted within 7 days of delivery."
        onConfirm={requestReturn}
        reason={reason}
        setReason={setReason}
        confirmLabel="Submit request"
      />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}

function ReasonDialog({
  open, onOpenChange, title, description, onConfirm, reason, setReason, confirmLabel, destructive,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  reason: string;
  setReason: (v: string) => void;
  confirmLabel: string;
  destructive?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Your reason…" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Back</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}