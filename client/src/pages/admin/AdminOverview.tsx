import { useStore } from "@/lib/useStore";
import type { Order, Product, User } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, Users, Store, ShoppingCart } from "lucide-react";
import { useMemo } from "react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--primary-glow))", "hsl(var(--secondary))", "hsl(var(--success))"];

export default function AdminOverview() {
  const [users] = useStore<User[]>("users", []);
  const [products] = useStore<Product[]>("products", []);
  const [orders] = useStore<Order[]>("orders", []);

  const revenue = orders.filter((o) => o.status !== "Cancelled").reduce((s, o) => s + o.total, 0);
  const customers = users.filter((u) => u.role === "customer").length;
  const vendors = users.filter((u) => u.role === "vendor").length;

  const series = useMemo(() => {
    const days: { day: string; revenue: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const day = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const ofDay = orders.filter((o) => o.createdAt.slice(0, 10) === key && o.status !== "Cancelled");
      days.push({ day, revenue: ofDay.reduce((s, o) => s + o.total, 0), orders: ofDay.length });
    }
    return days;
  }, [orders]);

  const categoryRevenue = useMemo(() => {
    const map = new Map<string, number>();
    orders.filter((o) => o.status !== "Cancelled").forEach((o) =>
      o.items.forEach((i) => {
        const cat = products.find((p) => p.id === i.productId)?.category ?? "Other";
        map.set(cat, (map.get(cat) ?? 0) + i.price * i.quantity);
      }),
    );
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders, products]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<IndianRupee />} label="Revenue" value={formatINR(revenue)} />
        <Stat icon={<ShoppingCart />} label="Orders" value={String(orders.length)} />
        <Stat icon={<Users />} label="Customers" value={String(customers)} />
        <Stat icon={<Store />} label="Vendors" value={String(vendors)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-card lg:col-span-2">
          <h3 className="text-sm font-semibold">Platform revenue · last 14 days</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => formatINR(v)}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold">Revenue by category</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryRevenue} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                  {categoryRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v: number) => formatINR(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-card">
        <h3 className="text-sm font-semibold">Daily orders</h3>
        <div className="mt-4 h-56">
          <ResponsiveContainer>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="orders" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}