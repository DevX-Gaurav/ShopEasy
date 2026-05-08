import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/lib/useStore";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function VendorProfile() {
  const { user } = useAuth();
  const [users, setUsers] = useStore<User[]>("users", []);
  const [name, setName] = useState(user?.name ?? "");
  const [shopName, setShopName] = useState(user?.shopName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");

  if (!user) return null;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(users.map((u) => (u.id === user.id ? { ...u, name, shopName, phone, address } : u)));
    toast.success("Shop profile updated");
  };

  return (
    <form onSubmit={save} className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="text-lg font-bold">Shop profile</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label>Owner name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Shop name</Label><Input value={shopName} onChange={(e) => setShopName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Email</Label><Input value={user.email} disabled /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label>Pickup address</Label><Textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} /></div>
      </div>
      <Button className="mt-5" size="lg">Save changes</Button>
    </form>
  );
}