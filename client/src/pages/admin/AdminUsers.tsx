import { useState } from "react";
import { useStore } from "@/lib/useStore";
import type { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Ban, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminUsers({ role }: { role: "customer" | "vendor" }) {
  const [users, setUsers] = useStore<User[]>("users", []);
  const list = users.filter((u) => u.role === role);
  const [target, setTarget] = useState<User | null>(null);
  const [reason, setReason] = useState("");

  const toggle = (u: User) => {
    if (u.status === "active") {
      setTarget(u);
      setReason("");
    } else {
      setUsers(users.map((x) => (x.id === u.id ? { ...x, status: "active", suspensionReason: undefined } : x)));
      toast.success(`${u.name} reactivated`);
    }
  };

  const confirmSuspend = () => {
    if (!target) return;
    if (!reason.trim()) return toast.error("Reason required");
    setUsers(users.map((x) => (x.id === target.id ? { ...x, status: "suspended", suspensionReason: reason.trim() } : x)));
    toast.success(`${target.name} suspended`);
    setTarget(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold capitalize">{role}s ({list.length})</h2>
        <p className="text-sm text-muted-foreground">Suspend or reactivate accounts.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Name</th>
                <th className="px-3 py-3 text-left">Email</th>
                {role === "vendor" && <th className="px-3 py-3 text-left">Shop</th>}
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-3 font-medium">{u.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                  {role === "vendor" && <td className="px-3 py-3">{u.shopName ?? "—"}</td>}
                  <td className="px-3 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", u.status === "active" ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive")}>
                      {u.status}
                    </span>
                    {u.status === "suspended" && u.suspensionReason && (
                      <div className="mt-1 text-xs text-muted-foreground">{u.suspensionReason}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Button size="sm" variant={u.status === "active" ? "outline" : "default"} onClick={() => toggle(u)}>
                      {u.status === "active" ? (<><Ban className="h-4 w-4" /> Suspend</>) : (<><CheckCircle2 className="h-4 w-4" /> Reactivate</>)}
                    </Button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No {role}s yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Suspend {target?.name}</DialogTitle></DialogHeader>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for suspension" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmSuspend}>Suspend</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}