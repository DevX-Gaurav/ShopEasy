import { useStore } from "@/lib/useStore";
import type { Order, Product } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatINR } from "@/lib/format";
import { Package, ShoppingCart, IndianRupee, AlertTriangle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { statusColor } from "@/lib/orders";
import { cn } from "@/lib/utils";

const COLORS = ["hsl(var(--primary))", "hsl(var(--primary-glow))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--warning))"];

export default function VendorOverview() {
  const { user } = useAuth();
  const [products] = useStore<Product[]>("products", []);
  const [orders] = useStore<Order[]>("orders", []);

  const myProducts = useMemo(() => products.filter((p) => p.vendorId === user?.id), [products, user]);
  const myOrderItems = useMemo(() => {
    return orders.flatMap((o) => o.items.filter((i) => i.vendorId === user?.id).map((i) => ({ ...i, order: o })));
  }, [orders, user]);

  const revenue = myOrderItems.reduce((s, i) => (i.order.status === "Cancelled" ? s : s + i.price * i.quantity), 0);
  const lowStock = myProducts.filter((p) => p.stock > 0 && p.stock < 10);
  const myOrders = useMemo(() => orders.filter((o) => o.items.some((i) => i.vendorId === user?.id)), [orders, user]);

  // Sales last 7 days
  const series = useMemo(() => {
    const days: { day: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: d.toLocaleDateString("en-IN", { weekday: "short" }), revenue: 0, orders: 0 });
      const ordersOfDay = myOrders.filter((o) => o.createdAt.slice(0, 10) === key && o.status !== "Cancelled");
      const last = days[days.length - 1];
      last.orders = ordersOfDay.length;
      last.revenue = ordersOfDay.reduce(
        (s, o) => s + o.items.filter((i) => i.vendorId === user?.id).reduce((a, i) => a + i.price * i.quantity, 0),
        0,
      );
    }
    return days;
  }, [myOrders, user]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    myProducts.forEach((p) => map.set(p.category, (map.get(p.category) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [myProducts]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<IndianRupee />} label="Revenue" value={formatINR(revenue)} />
        <Stat icon={<ShoppingCart />} label="Orders" value={String(myOrders.length)} />
        <Stat icon={<Package />} label="Products" value={String(myProducts.length)} />
        <Stat icon={<AlertTriangle />} label="Low stock" value={String(lowStock.length)} accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-2">
          <h3 className="text-sm font-semibold">Revenue · last 7 days</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => formatINR(v)}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold">Catalog mix</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent orders</h3>
          <Link to="/vendor/orders" className="text-xs font-medium text-primary hover:underline">View all →</Link>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-2 py-2 text-left">Order</th><th className="px-2 py-2 text-left">Customer</th><th className="px-2 py-2 text-left">Status</th><th className="px-2 py-2 text-right">Total</th></tr>
            </thead>
            <tbody>
              {myOrders.slice(0, 5).map((o) => {
                const myTotal = o.items.filter((i) => i.vendorId === user?.id).reduce((s, i) => s + i.price * i.quantity, 0);
                return (
                  <tr key={o.id} className="border-t">
                    <td className="px-2 py-3"><Link to={`/vendor/orders/${o.id}`} className="font-mono text-xs font-bold hover:text-primary">{o.id}</Link></td>
                    <td className="px-2 py-3">{o.customerName}</td>
                    <td className="px-2 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusColor(o.status))}>{o.status}</span></td>
                    <td className="px-2 py-3 text-right font-semibold">{formatINR(myTotal)}</td>
                  </tr>
                );
              })}
              {myOrders.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", accent ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary")}>
          <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        </span>
      </div>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}