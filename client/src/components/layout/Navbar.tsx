import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Package,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Electronics", "Fashion", "Footwear"] as const;

export function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  };

  const dashboardPath =
    user?.role === "admin" ? "/admin" : user?.role === "vendor" ? "/vendor" : "/account";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-3 sm:gap-6">
        {/* Mobile menu toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-sunset text-primary-foreground shadow-glow">
            <ShoppingBag className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            shop<span className="text-gradient-sunset">easy</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          <NavLink
            to="/"
            end
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            activeClassName="!text-foreground bg-accent"
          >
            Home
          </NavLink>
          {CATEGORIES.map((c) => (
            <NavLink
              key={c}
              to={`/category/${c}`}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              activeClassName="!text-foreground bg-accent"
            >
              {c}
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={submitSearch} className="ml-auto hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands, vendors…"
              className="pl-9"
            />
          </div>
        </form>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-md border hover:bg-accent"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-10 items-center gap-2 rounded-md border px-3 hover:bg-accent">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm font-medium sm:inline">
                    {user.name.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-semibold">{user.name}</div>
                  <div className="text-xs font-normal capitalize text-muted-foreground">
                    {user.role} · {user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={dashboardPath} className="cursor-pointer">
                    {user.role === "admin" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : user.role === "vendor" ? (
                      <LayoutDashboard className="h-4 w-4" />
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                    {user.role === "admin"
                      ? "Admin panel"
                      : user.role === "vendor"
                        ? "Vendor dashboard"
                        : "My account"}
                  </Link>
                </DropdownMenuItem>
                {user.role === "customer" && (
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">
                      <Package className="h-4 w-4" /> My orders
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "border-t md:hidden",
          open ? "block animate-slide-down" : "hidden",
        )}
      >
        <div className="container space-y-3 py-4">
          <form onSubmit={submitSearch}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="pl-9"
              />
            </div>
          </form>
          <nav className="grid gap-1">
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Home
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                to={`/category/${c}`}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                {c}
              </Link>
            ))}
            {!user && (
              <Link
                to="/auth/login"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
              >
                Log in
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}