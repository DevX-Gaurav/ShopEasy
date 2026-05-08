import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/useStore";
import type { Product } from "@/lib/types";
import { ensureSeeded } from "@/lib/seed";
import { ProductGrid } from "@/components/ProductCard";

const HERO_IMG =
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80";

const Index = () => {
  useEffect(() => { ensureSeeded(); }, []);
  const [products] = useStore<Product[]>("products", []);

  const trending = [...products].sort((a, b) => b.rating - a.rating).slice(0, 5);
  const newArrivals = products.slice(0, 10);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.18),transparent_55%)]" />
        <div className="container relative grid gap-10 py-12 lg:grid-cols-2 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Burnt Sunset Collection · 2026
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Curated craft. <br />
              <span className="text-gradient-sunset">Considered color.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              A modern multi-vendor marketplace celebrating independent makers — from heritage textiles to next-gen audio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/category/Fashion">
                  Shop the collection <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth/signup">Become a vendor</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 text-sm">
              <Stat icon={<Truck className="h-4 w-4" />} label="Free shipping" sub="Over ₹999" />
              <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Secure checkout" sub="UPI · Cards" />
              <Stat icon={<Headphones className="h-4 w-4" />} label="24/7 support" sub="Real humans" />
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border bg-card shadow-elevated">
              <img src={HERO_IMG} alt="Curated marketplace" className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Shop by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">Three worlds, one marketplace.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <CategoryCard
            label="Fashion"
            tag="Hand-crafted apparel"
            img="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80"
          />
          <CategoryCard
            label="Electronics"
            tag="Smart & sound"
            img="https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=900&q=80"
          />
          <CategoryCard
            label="Footwear"
            tag="Built to walk"
            img="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80"
          />
        </div>
      </section>

      {/* Trending */}
      <section className="container py-8 sm:py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Trending now</h2>
            <p className="mt-1 text-sm text-muted-foreground">Top picks loved by our community.</p>
          </div>
        </div>
        <ProductGrid products={trending} />
      </section>

      {/* New arrivals */}
      <section className="container py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">New arrivals</h2>
            <p className="mt-1 text-sm text-muted-foreground">Fresh to the shelves.</p>
          </div>
          <Link to="/shop" className="hidden text-sm font-medium text-primary hover:underline sm:inline">
            View all →
          </Link>
        </div>
        <ProductGrid products={newArrivals} />
      </section>
    </div>
  );
};

function Stat({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function CategoryCard({ label, tag, img }: { label: string; tag: string; img: string }) {
  return (
    <Link
      to={`/category/${label}`}
      className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
    >
      <img src={img} alt={label} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
        <div className="text-xs uppercase tracking-widest text-background/70">{tag}</div>
        <div className="mt-1 flex items-center gap-2 text-2xl font-bold">
          {label} <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

export default Index;
