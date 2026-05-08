import { Outlet } from "react-router-dom";
import { DashboardLayout, NavItem } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, Package, ShoppingCart, RotateCcw, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV: NavItem[] = [
  { to: "/vendor", label: "Overview", icon: <LayoutDashboard /> },
  { to: "/vendor/products", label: "Products", icon: <Package /> },
  { to: "/vendor/orders", label: "Orders", icon: <ShoppingCart /> },
  { to: "/vendor/returns", label: "Returns", icon: <RotateCcw /> },
  { to: "/vendor/profile", label: "Shop profile", icon: <Store /> },
];

export default function VendorLayout() {
  const { user } = useAuth();
  return (
    <DashboardLayout title="Vendor dashboard" subtitle={user?.shopName ?? user?.name} nav={NAV}>
      <Outlet />
    </DashboardLayout>
  );
}