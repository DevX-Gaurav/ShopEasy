import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/lib/useStore";
import type { User, Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Package, Heart, MapPin, ChevronRight } from "lucide-react";
import { formatINR } from "@/lib/format";

export default function Account() {
  const { user } = useAuth();
  const [users, setUsers] = useStore<User[]>("users", []);
  const [orders] = useStore<Order[]>("orders", []);
  const mine = orders.filter((o) => o.customerId === user?.id);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");

  if (!user) return null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(users.map((u) => (u.id === user.id ? { ...u, name, phone, address } : u)));
    toast.success("Profile updated");
  };

  return (
    <div className="container py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your profile, addresses and orders.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Stat icon={<Package className="h-5 w-5" />} label="Orders" value={String(mine.length)} to="/orders" />
        <Stat icon={<MapPin className="h-5 w-5" />} label="Default address" value={address ? "Saved" : "Not set"} />
        <Stat icon={<Heart className="h-5 w-5" />} label="Total spent" value={formatINR(mine.reduce((s, o) => s + (o.status !== "Cancelled" ? o.total : 0), 0))} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={save} className="rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Default address</Label>
              <Textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          </div>
          <Button className="mt-5" size="lg">Save changes</Button>
        </form>

        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Recent orders</h2>
          <div className="mt-3 divide-y">
            {mine.slice(0, 5).map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="flex items-center justify-between gap-2 py-3 hover:bg-accent/30">
                <div>
                  <div className="font-mono text-sm font-bold">{o.id}</div>
                  <div className="text-xs text-muted-foreground">{o.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatINR(o.total)}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
            {mine.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, to }: { icon: React.ReactNode; label: string; value: string; to?: string }) {
  const inner = (
    <div className="flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-lg font-bold">{value}</div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}