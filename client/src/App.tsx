import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import AppLayout from "@/components/layout/AppLayout";
import { RoleGuard } from "@/components/RoleGuard";

import Auth from "./pages/auth/Auth";
import Shop from "./pages/customer/Shop";
import ProductDetail from "./pages/customer/ProductDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderSuccess from "./pages/customer/OrderSuccess";
import Orders from "./pages/customer/Orders";
import OrderDetail from "./pages/customer/OrderDetail";
import Account from "./pages/customer/Account";

import VendorLayout from "./pages/vendor/VendorLayout";
import VendorOverview from "./pages/vendor/VendorOverview";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorOrderDetail from "./pages/vendor/VendorOrderDetail";
import VendorReturns from "./pages/vendor/VendorReturns";
import VendorProfile from "./pages/vendor/VendorProfile";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminComplaints from "./pages/admin/AdminComplaints";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Auth pages — no main layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/category/:category" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/auth/login" element={<Auth mode="login" />} />
                <Route path="/auth/signup" element={<Auth mode="signup" />} />
                <Route path="/auth/forgot" element={<Auth mode="forgot" />} />

                {/* Customer */}
                <Route path="/checkout" element={<RoleGuard allow={["customer"]}><Checkout /></RoleGuard>} />
                <Route path="/order-success/:id" element={<RoleGuard allow={["customer"]}><OrderSuccess /></RoleGuard>} />
                <Route path="/orders" element={<RoleGuard allow={["customer"]}><Orders /></RoleGuard>} />
                <Route path="/orders/:id" element={<RoleGuard allow={["customer"]}><OrderDetail /></RoleGuard>} />
                <Route path="/account" element={<RoleGuard allow={["customer"]}><Account /></RoleGuard>} />

                {/* Vendor */}
                <Route path="/vendor" element={<RoleGuard allow={["vendor"]}><VendorLayout /></RoleGuard>}>
                  <Route index element={<VendorOverview />} />
                  <Route path="products" element={<VendorProducts />} />
                  <Route path="orders" element={<VendorOrders />} />
                  <Route path="orders/:id" element={<VendorOrderDetail />} />
                  <Route path="returns" element={<VendorReturns />} />
                  <Route path="profile" element={<VendorProfile />} />
                </Route>

                {/* Admin */}
                <Route path="/admin" element={<RoleGuard allow={["admin"]}><AdminLayout /></RoleGuard>}>
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<AdminUsers role="customer" />} />
                  <Route path="vendors" element={<AdminUsers role="vendor" />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="complaints" element={<AdminComplaints />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
