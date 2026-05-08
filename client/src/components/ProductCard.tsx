import { Link } from "react-router-dom";
import { Star, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { finalPrice, formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const out = product.stock <= 0;
  const price = finalPrice(product.price, product.discount);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    add({
      productId: product.id,
      quantity: 1,
      selectedColor: product.colors[0],
      selectedSize: product.sizes[0],
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.discount > 0 && !out && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm">
            -{product.discount}%
          </span>
        )}
        {out && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-destructive px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-lg">
              Out of stock
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary/80">
          {product.category}
        </div>
        <h3 className="mt-1 line-clamp-2 min-h-[44px] text-sm font-bold leading-tight sm:text-base">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          {product.rating.toFixed(1)} ({product.ratingCount})
        </div>
        <p className="mt-2 line-clamp-2 min-h-[40px] text-xs text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {out ? (
            <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-destructive">
              Out of stock
            </span>
          ) : (
            <div>
              <div className="text-base font-bold leading-none">{formatINR(price)}</div>
              {product.discount > 0 && (
                <div className="mt-1 text-xs text-muted-foreground line-through">
                  {formatINR(product.price)}
                </div>
              )}
            </div>
          )}
          <Button size="sm" disabled={out} onClick={handleAdd}>
            <ShoppingBag className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed py-20 text-center text-muted-foreground">
        No products found.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}