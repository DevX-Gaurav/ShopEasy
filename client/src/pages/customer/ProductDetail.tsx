import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "@/lib/useStore";
import type { Product, Review } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { finalPrice, formatINR, formatDate } from "@/lib/format";
import { Star, ShoppingBag, Truck, ShieldCheck, RotateCcw, Store, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProductGrid } from "@/components/ProductCard";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [products] = useStore<Product[]>("products", []);
  const [reviews, setReviews] = useStore<Review[]>("reviews", []);
  const { add } = useCart();
  const { user } = useAuth();

  const product = products.find((p) => p.id === id);
  const productReviews = useMemo(() => reviews.filter((r) => r.productId === id), [reviews, id]);
  const [imgIdx, setImgIdx] = useState(0);
  const [color, setColor] = useState<string | undefined>(product?.colors[0]);
  const [size, setSize] = useState<string | undefined>(product?.sizes[0]);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Button asChild className="mt-4"><Link to="/shop">Browse all</Link></Button>
      </div>
    );
  }

  const out = product.stock <= 0;
  const price = finalPrice(product.price, product.discount);
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 5);

  const handleAdd = () => {
    if (out) return;
    if (product.sizes.length && !size) return toast.error("Please select a size");
    add({ productId: product.id, quantity: qty, selectedColor: color, selectedSize: size });
    toast.success(`${product.name} added to cart`);
  };

  const handleBuy = () => {
    handleAdd();
    if (!out && (!product.sizes.length || size)) navigate("/checkout");
  };

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please log in to leave a review");
    if (!comment.trim()) return toast.error("Please write a comment");
    const review: Review = {
      id: `r-${Date.now().toString(36)}`,
      productId: product.id,
      customerId: user.id,
      customerName: user.name,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    setReviews([review, ...reviews]);
    setComment("");
    toast.success("Thanks for your review!");
  };

  return (
    <div className="container py-8 sm:py-10">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link> /
        <Link to={`/category/${product.category}`} className="ml-1 hover:text-foreground">{product.category}</Link> /
        <span className="ml-1 text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="aspect-square overflow-hidden rounded-2xl border bg-muted">
            <img src={product.images[imgIdx]} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-lg border-2 bg-muted",
                    imgIdx === i ? "border-primary" : "border-transparent hover:border-border",
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <Link to={`/vendor/${product.vendorId}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <Store className="h-3.5 w-3.5" /> {product.vendorName}
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.ratingCount} reviews)</span>
            </div>
            <span className="text-muted-foreground">·</span>
            <span className={cn("font-medium", out ? "text-destructive" : "text-success")}>
              {out ? "Out of stock" : `${product.stock} in stock`}
            </span>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-3xl font-bold">{formatINR(price)}</span>
            {product.discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatINR(product.price)}</span>
                <span className="rounded-md bg-success/15 px-2 py-1 text-xs font-bold text-success">
                  Save {product.discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {product.colors.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold">Color: <span className="font-normal text-muted-foreground">{color}</span></div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "rounded-full border-2 px-3 py-1 text-xs font-medium transition-colors",
                      color === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold">Size</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-w-12 rounded-md border-2 px-3 py-1.5 text-sm font-medium transition-colors",
                      size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center rounded-md border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-10 w-10 items-center justify-center hover:bg-accent" aria-label="Decrease">
                <Minus className="h-4 w-4" />
              </button>
              <div className="w-12 text-center text-sm font-bold">{qty}</div>
              <button onClick={() => setQty(Math.min(product.stock || 1, qty + 1))} className="flex h-10 w-10 items-center justify-center hover:bg-accent" aria-label="Increase">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button onClick={handleAdd} disabled={out} size="lg" variant="outline">
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </Button>
            <Button onClick={handleBuy} disabled={out} size="lg" variant="hero">
              Buy now
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl border bg-muted/40 p-4 text-xs">
            <Perk icon={<Truck className="h-4 w-4" />} title="Free shipping" sub="Over ₹999" />
            <Perk icon={<RotateCcw className="h-4 w-4" />} title="7-day returns" sub="No questions" />
            <Perk icon={<ShieldCheck className="h-4 w-4" />} title="Secure pay" sub="UPI · Cards" />
          </div>
        </div>
      </div>

      {/* Specs */}
      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight">Specifications</h2>
        <div className="mt-3 rounded-2xl border bg-card p-6 shadow-card">
          <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
            {product.specifications}
          </pre>
        </div>
      </section>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight">Reviews ({productReviews.length})</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {productReviews.length === 0 && (
              <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                No reviews yet — be the first.
              </div>
            )}
            {productReviews.map((r) => (
              <div key={r.id} className="rounded-xl border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{r.customerName}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</div>
                </div>
                <div className="mt-1 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-3.5 w-3.5", i < r.rating ? "fill-warning text-warning" : "text-muted")} />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
            ))}
          </div>

          <form onSubmit={submitReview} className="rounded-xl border bg-card p-5 shadow-card">
            <h3 className="text-sm font-semibold">Write a review</h3>
            <div className="mt-3">
              <div className="text-xs text-muted-foreground">Your rating</div>
              <div className="mt-1 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setRating(n)}>
                    <Star className={cn("h-6 w-6 transition-colors", n <= rating ? "fill-warning text-warning" : "text-muted hover:text-warning/60")} />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Share your thoughts on this product…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-3"
              rows={4}
            />
            <Button type="submit" className="mt-3 w-full">Submit review</Button>
          </form>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold tracking-tight">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}

function Perk({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-semibold">{icon} {title}</div>
      <div className="mt-0.5 text-muted-foreground">{sub}</div>
    </div>
  );
}