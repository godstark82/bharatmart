"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import db from "@/lib/firebase/firestore";

import { Product } from "@/types/products";
import { Category } from "@/types/categories";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/* ---------- FORM TYPE (Product se derived) ---------- */
type ProductForm = Omit<
  Product,
  "id" | "createdAt" | "updatedAt"
>;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductForm>({
    name: "",
    slug: "",
    description: "",
    images: [],
    price: 0,
    categoryId: "",
    status: "active",
    metaTitle: "",
    metaDescription: "",
    keywords: [],
  });

  /* ================== FETCH CATEGORIES ================== */
  useEffect(() => {
    return onSnapshot(collection(db, "categories"), (snap) => {
      setCategories(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Category, "id">),
        }))
      );
    });
  }, []);

  /* ================== FETCH PRODUCTS ================== */
  useEffect(() => {
    return onSnapshot(collection(db, "products"), (snap) => {
      setProducts(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, "id">),
        }))
      );
    });
  }, []);

  /* ================== ADD PRODUCT ================== */
  async function addProduct() {
    if (!form.name || !form.categoryId) {
      alert("Product name & category required");
      return;
    }

    const slug = form.name.toLowerCase().replace(/\s+/g, "-");

    await addDoc(collection(db, "products"), {
      ...form,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setForm({
      name: "",
      slug: "",
      description: "",
      images: [],
      price: 0,
      categoryId: "",
      status: "active",
      metaTitle: "",
      metaDescription: "",
      keywords: [],
    });
  }

  /* ================== DELETE PRODUCT ================== */
  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
  }

  /* ================== CATEGORY NAME RESOLVER ================== */
  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || "—";

  return (
    <div className="space-y-10">
      {/* ================= ADD PRODUCT ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5">
          <div>
            <Label>Product Name</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={form.categoryId}
              onValueChange={(val) =>
                setForm({ ...form, categoryId: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Price (₹)</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label>Images </Label>
            <Input
              value={form.images.join(",")}
              onChange={(e) =>
                setForm({
                  ...form,
                  images: e.target.value
                    .split(",")
                    .map((i) => i.trim()),
                })
              }
            />
          </div>

          <div>
            <Label>Meta Title</Label>
            <Input
              value={form.metaTitle}
              onChange={(e) =>
                setForm({ ...form, metaTitle: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Meta Description</Label>
            <Textarea
              value={form.metaDescription}
              onChange={(e) =>
                setForm({
                  ...form,
                  metaDescription: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label> Keywords</Label>
            <Input
              value={form.keywords.join(",")}
              onChange={(e) =>
                setForm({
                  ...form,
                  keywords: e.target.value
                    .split(",")
                    .map((k) => k.trim()),
                })
              }
            />
          </div>

          <Button onClick={addProduct}>Save Product</Button>
        </CardContent>
      </Card>

      {/* ================= PRODUCT LIST ================= */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center rounded-lg border p-4"
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  ₹{p.price} · {getCategoryName(p.categoryId)}
                </p>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteProduct(p.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
