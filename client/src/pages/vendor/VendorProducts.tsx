import { useState } from "react";
import { useStore } from "@/lib/useStore";
import type { Category, Product } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { finalPrice, formatINR } from "@/lib/format";

const CATEGORIES: Category[] = ["Electronics", "Fashion", "Footwear"];
const DEFAULT_IMG = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80";

function emptyDraft(): Partial<Product> {
  return {
    name: "",
    description: "",
    specifications: "",
    price: 0,
    discount: 0,
    stock: 0,
    category: "Fashion",
    colors: [],
    sizes: [],
    images: [],
    rating: 0,
    ratingCount: 0,
  };
}

export default function VendorProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useStore<Product[]>("products", []);
  const mine = products.filter((p) => p.vendorId === user?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Partial<Product>>(emptyDraft());

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setDraft(p);
    setOpen(true);
  };

  const onImageUpload = (files: FileList | null) => {
    if (!files?.length) return;
    Array.from(files).forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        setDraft((d) => ({ ...d, images: [...(d.images ?? []), reader.result as string] }));
      };
      reader.readAsDataURL(f);
    });
  };

  const save = () => {
    if (!draft.name?.trim()) return toast.error("Name is required");
    if (!draft.price || draft.price <= 0) return toast.error("Valid price is required");
    const images = draft.images?.length ? draft.images : [DEFAULT_IMG];
    if (editing) {
      setProducts(products.map((p) => (p.id === editing.id ? { ...editing, ...draft, images } as Product : p)));
      toast.success("Product updated");
    } else {
      const np: Product = {
        id: `p-${Date.now().toString(36)}`,
        vendorId: user!.id,
        vendorName: user!.shopName ?? user!.name,
        name: draft.name!.trim(),
        description: draft.description ?? "",
        specifications: draft.specifications ?? "",
        price: Number(draft.price),
        discount: Number(draft.discount ?? 0),
        stock: Number(draft.stock ?? 0),
        category: (draft.category ?? "Fashion") as Category,
        subCategory: draft.subCategory,
        colors: draft.colors ?? [],
        sizes: draft.sizes ?? [],
        images,
        rating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
      };
      setProducts([np, ...products]);
      toast.success("Product created");
    }
    setOpen(false);
  };

  const remove = (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    setProducts(products.filter((x) => x.id !== p.id));
    toast.success("Product deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">My products ({mine.length})</h2>
          <p className="text-sm text-muted-foreground">Add, edit or remove your listings.</p>
        </div>
        <Button onClick={openCreate} variant="hero"><Plus className="h-4 w-4" /> Add product</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Product</th>
                <th className="px-3 py-3 text-left">Category</th>
                <th className="px-3 py-3 text-right">Price</th>
                <th className="px-3 py-3 text-right">Stock</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="line-clamp-1 font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.colors.length} colors · {p.sizes.length || "—"} sizes</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">{p.category}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="font-semibold">{formatINR(finalPrice(p.price, p.discount))}</div>
                    {p.discount > 0 && <div className="text-xs text-muted-foreground line-through">{formatINR(p.price)}</div>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={p.stock === 0 ? "font-bold text-destructive" : p.stock < 10 ? "font-bold text-warning" : ""}>{p.stock}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => remove(p)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {mine.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No products yet. Add your first listing!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name</Label>
              <Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={3} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Specifications</Label>
              <Textarea rows={3} value={draft.specifications ?? ""} onChange={(e) => setDraft({ ...draft, specifications: e.target.value })} placeholder="One per line" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={draft.category as string} onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Sub-category</Label>
              <Input value={draft.subCategory ?? ""} onChange={(e) => setDraft({ ...draft, subCategory: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input type="number" min={0} value={draft.price ?? 0} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Discount %</Label>
              <Input type="number" min={0} max={100} value={draft.discount ?? 0} onChange={(e) => setDraft({ ...draft, discount: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" min={0} value={draft.stock ?? 0} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Colors (comma separated)</Label>
              <Input value={(draft.colors ?? []).join(", ")} onChange={(e) => setDraft({ ...draft, colors: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Sizes (comma separated)</Label>
              <Input value={(draft.sizes ?? []).join(", ")} onChange={(e) => setDraft({ ...draft, sizes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Images</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/30 p-6 text-sm text-muted-foreground hover:bg-muted/60">
                <ImageIcon className="h-6 w-6" />
                Click to upload (multiple)
                <input type="file" multiple accept="image/*" className="sr-only" onChange={(e) => onImageUpload(e.target.files)} />
              </label>
              {(draft.images ?? []).length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {draft.images!.map((src, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden rounded-md border">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => setDraft({ ...draft, images: draft.images!.filter((_, j) => j !== i) })} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} variant="hero">{editing ? "Save changes" : "Create product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}