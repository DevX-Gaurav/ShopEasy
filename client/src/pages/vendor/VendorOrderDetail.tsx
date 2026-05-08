import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "@/lib/useStore";
import type { Order, User } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { canVendorCancel, nextStatus, restockOrder, statusColor } from "@/lib/orders";
import { formatDateTime, formatINR } from "@/lib/format";
import { ArrowRight, FileText, Download, X } from "lucide-react";
import { Invoice } from "@/components/Invoice";
import { downloadElementAsPdf } from "@/lib/pdf";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function VendorOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [orders, setOrders] = useStore<Order[]>("orders", []);
  const [users] = useStore<User[]>("users", []);
  const order = orders.find((o) => o.id === id);
  const vendor = users.find((u) => u.id === user?.id);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!order || !order.items.some((i) => i.vendorId === user?.id)) {
    return (
      <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
        Order not found.
        <div className="mt-4"><Button asChild variant="outline"><Link to="/vendor/orders">Back to orders</Link></Button></div>
      </div>
    );
  }

  const myItems = order.items.filter((i) => i.vendorId === user?.id);
  const myTotal = myItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const next = nextStatus(order.status);

  const advance = () => {
    if (!next) return;
    setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: next, updatedAt: new Date().toISOString() } : o)));
    toast.success(`Status → ${next}`);
  };

  const cancel = () => {
    if (!reason.trim()) return toast.error("Please provide a reason");
    setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: "Cancelled", cancelReason: reason.trim(), cancelledBy: "vendor", updatedAt: new Date().toISOString() } : o)));
    restockOrder(order);
    setCancelOpen(false);
    setReason("");
    toast.success("Order cancelled");
  };

  const downloadPdf = async () => {
    if (!invoiceRef.current) return;
    await downloadElementAsPdf(invoiceRef.current, `Invoice-${order.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <Link to="/vendor/orders" className="text-sm text-muted-foreground hover:text-foreground">← Back to orders</Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-mono text-xl font-bold">{order.id}</h2>
          <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", statusColor(order.status))}>{order.status}</span>
          <Button variant="outline" onClick={() => setInvoiceOpen(true)}><FileText className="h-4 w-4" /> Invoice</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h3 className="text-sm font-semibold">Your items in this order</h3>
          <ul className="mt-4 divide-y">
            {myItems.map((it, i) => (
              <li key={i} className="flex items-center gap-4 py-3">
                <div className="h-14 w-14 overflow-hidden rounded-md bg-muted">
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="line-clamp-1 font-medium">{it.name}</div>
                  <div className="text-xs text-muted-foreground">Qty {it.quantity} · {[it.selectedColor, it.selectedSize].filter(Boolean).join(" · ") || "Standard"}</div>
                </div>
                <div className="font-semibold">{formatINR(it.price * it.quantity)}</div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
            <span className="text-muted-foreground">Your total for this order</span>
            <span className="text-lg font-bold">{formatINR(myTotal)}</span>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-card">
            <h3 className="text-sm font-semibold">Customer</h3>
            <div className="mt-2 text-sm">
              <div className="font-medium">{order.customerName}</div>
              <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
              <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
              <div className="mt-2 text-xs text-muted-foreground">{order.shippingAddress}</div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-card space-y-2">
            <h3 className="text-sm font-semibold">Fulfilment</h3>
            {next && order.status !== "Cancelled" && (
              <Button onClick={advance} className="w-full" variant="hero">
                Mark as {next} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {canVendorCancel(order) && (
              <Button onClick={() => setCancelOpen(true)} variant="outline" className="w-full">
                <X className="h-4 w-4" /> Cancel order
              </Button>
            )}
            {order.status === "Delivered" && <p className="text-xs text-success">Order completed.</p>}
            {order.status === "Cancelled" && (
              <p className="text-xs text-destructive">Cancelled by {order.cancelledBy}: {order.cancelReason}</p>
            )}
          </div>
        </aside>
      </div>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="border-b p-4">
            <DialogTitle>Tax invoice · {order.id}</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto bg-slate-100 p-6">
            <div className="origin-top-left scale-[0.85] sm:scale-100">
              <Invoice ref={invoiceRef} order={order} vendor={vendor} vendorScoped />
            </div>
          </div>
          <DialogFooter className="border-t p-4">
            <Button variant="ghost" onClick={() => setInvoiceOpen(false)}>Close</Button>
            <Button onClick={downloadPdf} variant="hero"><Download className="h-4 w-4" /> Download PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancel this order?</DialogTitle></DialogHeader>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (will be visible to the customer)" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>Back</Button>
            <Button variant="destructive" onClick={cancel}>Cancel order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}