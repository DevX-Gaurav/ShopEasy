import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/lib/useStore";
import type { Order, Product, PaymentMethod } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { finalPrice, formatINR } from "@/lib/format";
import { decrementStock } from "@/lib/orders";
import { toast } from "sonner";
import {
  CreditCard,
  Wallet,
  Banknote,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  theme?: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENTS: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  usesRazorpay: boolean;
}[] = [
  {
    value: "UPI",
    label: "UPI",
    icon: <Smartphone className="h-4 w-4" />,
    usesRazorpay: true,
  },
  {
    value: "Card",
    label: "Credit / Debit Card",
    icon: <CreditCard className="h-4 w-4" />,
    usesRazorpay: true,
  },
  {
    value: "Net Banking",
    label: "Net Banking",
    icon: <Wallet className="h-4 w-4" />,
    usesRazorpay: true,
  },
  {
    value: "Cash on Delivery",
    label: "Cash on Delivery",
    icon: <Banknote className="h-4 w-4" />,
    usesRazorpay: false,
  },
];

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Dynamically load the Razorpay checkout script once. */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Checkout() {
  const { user } = useAuth();
  const { items, clear } = useCart();
  const [products] = useStore<Product[]>("products", []);
  const [orders, setOrders] = useStore<Order[]>("orders", []);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [payment, setPayment] = useState<PaymentMethod>("UPI");
  const [busy, setBusy] = useState(false);

  // Pre-load Razorpay script on mount so it's ready when needed.
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const enriched = useMemo(
    () =>
      items
        .map((it) => ({
          item: it,
          product: products.find((p) => p.id === it.productId),
        }))
        .filter((x) => x.product) as {
        item: (typeof items)[number];
        product: Product;
      }[],
    [items, products],
  );

  const subtotal = enriched.reduce(
    (s, { item, product }) =>
      s + finalPrice(product.price, product.discount) * item.quantity,
    0,
  );
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  if (enriched.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button onClick={() => navigate("/shop")} className="mt-4">
          Browse products
        </Button>
      </div>
    );
  }

  // ── Build & persist order after successful payment ──────────────────────────
  function saveOrder(paymentMethod: PaymentMethod) {
    const orderItems = enriched.map(({ item, product }) => ({
      productId: product.id,
      vendorId: product.vendorId,
      name: product.name,
      image: product.images[0],
      price: finalPrice(product.price, product.discount),
      quantity: item.quantity,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    }));

    const order: Order = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      customerId: user!.id,
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerPhone: phone.trim(),
      shippingAddress: address.trim(),
      items: orderItems,
      subtotal,
      shipping,
      total,
      paymentMethod,
      status: "Placed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders([order, ...orders]);
    decrementStock(orderItems);
    clear();
    return order;
  }

  // ── Razorpay flow ────────────────────────────────────────────────────────────
  async function initiateRazorpay() {
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      toast.error("Failed to load payment gateway. Please try again.");
      return false;
    }

    // 1. Create order on backend
    const createRes = await fetch(`${BACKEND_URL}/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: total,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.message || "Could not create payment order.");
    }

    const { orderId, amount: rzpAmount, currency } = await createRes.json();

    // 2. Open Razorpay modal (returns via Promise)
    return new Promise<boolean>((resolve) => {
      const options: RazorpayOptions = {
        key: RAZORPAY_KEY_ID,
        amount: rzpAmount, // already in paise from backend
        currency,
        name: "ShopEasy",
        description: `Order payment — ${enriched.length} item(s)`,
        order_id: orderId,
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: phone.trim(),
        },
        notes: { shippingAddress: address.trim() },
        theme: { color: "#EA580C" },

        // 3. On successful payment → verify on backend
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              resolve(true);
            } else {
              toast.error("Payment verification failed. Contact support.");
              resolve(false);
            }
          } catch {
            toast.error("Payment verification error. Contact support.");
            resolve(false);
          }
        },

        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled.");
            resolve(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    });
  }

  // ── Main submit handler ──────────────────────────────────────────────────────
  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate("/auth/login?next=/checkout");

    setBusy(true);
    try {
      const isRazorpayMethod =
        PAYMENTS.find((p) => p.value === payment)?.usesRazorpay ?? false;

      if (isRazorpayMethod) {
        // ── Online payment via Razorpay ─────────────────────────────────────
        const verified = await initiateRazorpay();
        if (!verified) return; // user cancelled or verification failed

        const order = saveOrder(payment);
        toast.success("Payment successful! Order placed.");
        navigate(`/order-success/${order.id}`, { replace: true });
      } else {
        // ── Cash on Delivery ────────────────────────────────────────────────
        const order = saveOrder(payment);
        toast.success("Order placed successfully!");
        navigate(`/order-success/${order.id}`, { replace: true });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const selectedIsRazorpay =
    PAYMENTS.find((p) => p.value === payment)?.usesRazorpay ?? false;

  return (
    <div className="container py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Checkout
      </h1>
      <form
        onSubmit={placeOrder}
        className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]"
      >
        <div className="space-y-6">
          {/* ── Shipping details ── */}
          <Section title="Shipping details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 …"
                />
              </Field>
              <Field label="Address" full>
                <Textarea
                  required
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat, street, city, state, PIN"
                />
              </Field>
            </div>
          </Section>

          {/* ── Payment method ── */}
          <Section title="Payment method">
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENTS.map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-all",
                    payment === p.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    checked={payment === p.value}
                    onChange={() => setPayment(p.value)}
                  />
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md",
                      payment === p.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {p.icon}
                  </span>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{p.label}</span>
                    {p.usesRazorpay && (
                      <p className="text-xs text-muted-foreground">
                        via Razorpay
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {/* Razorpay badge */}
            {selectedIsRazorpay ? (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Secured by{" "}
                <span className="font-semibold text-foreground">Razorpay</span>.
                Your payment info is never stored on our servers.
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Pay when your order arrives at your doorstep.
              </p>
            )}
          </Section>
        </div>

        {/* ── Order summary sidebar ── */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-2xl border bg-card p-6 shadow-card">
            <h2 className="text-lg font-bold">Order summary</h2>
            <ul className="mt-4 max-h-72 space-y-3 overflow-auto">
              {enriched.map(({ item, product }) => (
                <li
                  key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`}
                  className="flex gap-3"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="line-clamp-1 font-medium">
                      {product.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qty {item.quantity}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">
                    {formatINR(
                      finalPrice(product.price, product.discount) *
                        item.quantity,
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t pt-4 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              <Row
                label="Shipping"
                value={shipping === 0 ? "Free" : formatINR(shipping)}
              />
              <Row label="Total" value={formatINR(total)} bold />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="mt-5 w-full"
              size="lg"
              variant="hero"
            >
              {busy
                ? selectedIsRazorpay
                  ? "Opening payment…"
                  : "Placing order…"
                : selectedIsRazorpay
                  ? `Pay · ${formatINR(total)}`
                  : `Place order · ${formatINR(total)}`}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-card">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "text-base font-bold" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}
