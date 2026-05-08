import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useStore } from "@/lib/useStore";
import type { Product, Category } from "@/lib/types";
import { ProductGrid } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { finalPrice } from "@/lib/format";

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "new", label: "Newest first" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Top rated" },
];

export default function Shop() {
  const { category } = useParams<{ category?: Category }>();
  const [params] = useSearchParams();
  const q = params.get("q")?.toLowerCase() ?? "";
  const [products] = useStore<Product[]>("products", []);

  const maxPrice = Math.max(0, ...products.map((p) => finalPrice(p.price, p.discount)));
  const [price, setPrice] = useState<number>(maxPrice || 100000);
  const [sort, setSort] = useState("popular");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const filtered = useMemo(() => {
    let list = products.slice();
    if (category) list = list.filter((p) => p.category === category);
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.vendorName.toLowerCase().includes(q),
      );
    }
    list = list.filter((p) => finalPrice(p.price, p.discount) <= price);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => finalPrice(a.price, a.discount) - finalPrice(b.price, b.discount));
        break;
      case "price-desc":
        list.sort((a, b) => finalPrice(b.price, b.discount) - finalPrice(a.price, a.discount));
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "new":
        list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
        break;
      default:
        list.sort((a, b) => b.ratingCount - a.ratingCount);
    }
    return list;
  }, [products, category, q, price, sort, inStockOnly, minRating]);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 flex items-center justify-between text-sm">
          <span>Max price</span>
          <span className="font-mono text-xs text-muted-foreground">≤ ₹{price.toLocaleString("en-IN")}</span>
        </Label>
        <Slider value={[price]} max={maxPrice || 100000} min={0} step={500} onValueChange={(v) => setPrice(v[0])} />
      </div>
      <div>
        <Label className="mb-2 block text-sm">Minimum rating</Label>
        <div className="flex flex-wrap gap-1.5">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${minRating === r ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {r === 0 ? "All" : `${r}★ & up`}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="instock" type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="h-4 w-4 accent-primary" />
        <Label htmlFor="instock" className="text-sm">In stock only</Label>
      </div>
    </div>
  );

  return (
    <div className="container py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {category ? category : q ? `Results for "${q}"` : "All products"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{filtered.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-6">{filterPanel}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" /> Filters
            </div>
            {filterPanel}
          </div>
        </aside>
        <ProductGrid products={filtered} />
      </div>
    </div>
  );
}