import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const SidebarBody = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((n) => {
        const active =
          n.to === pathname ||
          (n.to !== "/vendor" && n.to !== "/admin" && pathname.startsWith(n.to));
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span className="[&_svg]:h-4 [&_svg]:w-4">{n.icon}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="container py-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md border lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle sidebar"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside
          className={cn(
            "rounded-2xl border bg-card shadow-card lg:sticky lg:top-20 lg:h-fit lg:block",
            open ? "block" : "hidden lg:block",
          )}
        >
          {SidebarBody}
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}