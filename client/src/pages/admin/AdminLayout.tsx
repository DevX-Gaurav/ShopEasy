import { Outlet } from "react-router-dom";
import { DashboardLayout, NavItem } from "@/components/layout/DashboardLayout";
import { LayoutDashboard, Users, Store, ShoppingCart, MessageSquareWarning } from "lucide-react";

const NAV: NavItem[] = [
  { to: "/admin", label: "Overview", icon: <LayoutDashboard /> },
  { to: "/admin/users", label: "Customers", icon: <Users /> },
  { to: "/admin/vendors", label: "Vendors", icon: <Store /> },
  { to: "/admin/orders", label: "All orders", icon: <ShoppingCart /> },
  { to: "/admin/complaints", label: "Complaints", icon: <MessageSquareWarning /> },
];

export default function AdminLayout() {
  return (
    <DashboardLayout title="Admin panel" subtitle="Platform-wide controls and insights" nav={NAV}>
      <Outlet />
    </DashboardLayout>
  );
}