import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/lib/useStore";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { finalPrice, formatINR } from "@/lib/format";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Cart() {
  const { items, setQty, remove } = useCart();
  const [products] = useStore<Product[]>("products", []);
  const navigate = useNavigate();
  const { user } = useAuth();

  const enriched = items
    .map((it) => ({ item: it, product: products.find((p) => p.id === it.productId) }))
    .filter((x) => x.product) as { item: typeof items[number]; product: Product }[];

  const subtotal = enriched.reduce(
    (sum, { item, product }) => sum + finalPrice(product.price, product.discount) * item.quantity,
    0,
  );
  const shipping = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  if (enriched.length === 0) {
    return (
      <div className="container py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Discover something you'll love.</p>
        <Button asChild className="mt-6"><Link to="/shop">Start shopping</Link></Button>
      </div>
    );
  }

  const checkout = () => {
    if (!user) return navigate("/auth/login?next=/checkout");
    navigate("/checkout");
  };

  return (
    <div className="container py-8 sm:py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your cart</h1>
      <p className="mt-1 text-sm text-muted-foreground">{enriched.length} item(s)</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {enriched.map(({ item, product }) => {
            const price = finalPrice(product.price, product.discount);
            return (
              <div key={`${item.productId}-${item.selectedColor}-${item.selectedSize}`} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-card">
                <Link to={`/product/${product.id}`} className="aspect-square h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/product/${product.id}`} className="line-clamp-1 font-semibold hover:text-primary">
                        {product.name}
                      </Link>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {[item.selectedColor, item.selectedSize].filter(Boolean).join(" · ")}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">Sold by {product.vendorName}</div>
                    </div>
                    <button onClick={() => remove(item.productId, item.selectedColor, item.selectedSize)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center rounded-md border">
                      <button onClick={() => setQty(item.productId, item.quantity - 1, item.selectedColor, item.selectedSize)} className="flex h-9 w-9 items-center justify-center hover:bg-accent">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <div className="w-10 text-center text-sm font-bold">{item.quantity}</div>
                      <button onClick={() => setQty(item.productId, item.quantity + 1, item.selectedColor, item.selectedSize)} className="flex h-9 w-9 items-center justify-center hover:bg-accent">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="font-bold">{formatINR(price * item.quantity)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-20 h-fit rounded-2xl border bg-card p-6 shadow-card">
          <h2 className="text-lg font-bold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? "Free" : formatINR(shipping)} />
            <div className="my-3 border-t" />
            <Row label="Total" value={formatINR(total)} bold />
          </dl>
          <Button onClick={checkout} className="mt-5 w-full" size="lg" variant="hero">
            Checkout
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/shop">Continue shopping</Link></Button>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-muted-foreground"}`}>
      <dt>{label}</dt>
      <dd className={bold ? "text-foreground" : ""}>{value}</dd>
    </div>
  );
}