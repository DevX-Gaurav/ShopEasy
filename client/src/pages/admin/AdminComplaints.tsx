import { useStore } from "@/lib/useStore";
import type { Complaint } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function AdminComplaints() {
  const [complaints, setComplaints] = useStore<Complaint[]>("complaints", []);

  const resolve = (id: string) => {
    setComplaints(complaints.map((c) => (c.id === id ? { ...c, status: "Resolved" } : c)));
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Complaints ({complaints.length})</h2>
        <p className="text-sm text-muted-foreground">Customer & vendor reports.</p>
      </div>
      <div className="space-y-3">
        {complaints.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.fromRole} · {c.fromUserName}</div>
                <div className="mt-0.5 text-base font-bold">{c.subject}</div>
                <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</div>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", c.status === "Open" ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>
                {c.status}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{c.message}</p>
            {c.status === "Open" && (
              <Button size="sm" className="mt-3" onClick={() => resolve(c.id)}><CheckCircle2 className="h-4 w-4" /> Mark resolved</Button>
            )}
          </div>
        ))}
        {complaints.length === 0 && (
          <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">No complaints.</div>
        )}
      </div>
    </div>
  );
}