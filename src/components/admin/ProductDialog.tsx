"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Product } from "@/types/products";
import { Category } from "@/types/categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
  sellerId: string;
}

type ProductForm = Omit<Product, "id" | "createdAt" | "updatedAt" | "sellerId">;

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  sellerId,
}: ProductDialogProps) {
  const [form, setForm] = useState<ProductForm>({
    title: "",
    description: "",
    images: [],
    price: 0,
    categoryId: "",
    whatsappNumber: "",
    sku: "",
    stock: undefined,
    status: "active",
    featured: false,
    tags: [],
    features: [],
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title || "",
        description: product.description || "",
        images: product.images || [],
        price: product.price ||0 ,
        categoryId: product.categoryId || "",
        whatsappNumber: product.whatsappNumber || "",
        sku: product.sku || "",
        stock: product.stock,
        status: product.status || "active",
        featured: product.featured || false,
        tags: product.tags || [],
        features: product.features || [],
      });
    } else {
      setForm({
        title: "",
        description: "",
        images: [],
        price: 0,
        categoryId: "",
        whatsappNumber: "",
        sku: "",
        stock: undefined,
        status: "active",
        featured: false,
        tags: [],
        features: [],
      });
    }
    setNewImageUrl("");
    setNewFeature("");
  }, [product, open]);

  const addProductMutation = useMutation({
    mutationFn: async (data: ProductForm & { sellerId: string }) => {
      await addDoc(collection(db, "products"), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
      setForm({
        title: "",
        description: "",
        images: [],
        price: 0,
        categoryId: "",
        whatsappNumber: "",
        sku: "",
        stock: undefined,
        status: "active",
        featured: false,
        tags: [],
        features: [],
      });
      setNewImageUrl("");
      setNewFeature("");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      if (!product) return;
      await updateDoc(doc(db, "products", product.id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.categoryId) {
      alert("Product title and category are required");
      return;
    }

    if (product) {
      updateProductMutation.mutate(form);
    } else {
      addProductMutation.mutate({ ...form, sellerId });
    }
  };

  const isLoading = addProductMutation.isPending || updateProductMutation.isPending;

  const addImage = () => {
    if (newImageUrl.trim()) {
      setForm({
        ...form,
        images: [...form.images, newImageUrl.trim()],
      });
      setNewImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    setForm({
      ...form,
      images: form.images.filter((_, i) => i !== index),
    });
  };

  const handleTagsChange = (value: string) => {
    setForm({
      ...form,
      tags: value.split(",").map((t) => t.trim()).filter(Boolean),
    });
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setForm({
        ...form,
        features: [...(form.features || []), newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setForm({
      ...form,
      features: form.features?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update the product details below."
              : "Create a new product listing."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enter product title"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(val) => setForm({ ...form, categoryId: val })}
                  disabled={isLoading}
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

              <div className="grid gap-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm">Product Images</h3>
              
              <div className="grid gap-2">
                <Label>Add Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addImage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addImage}
                    disabled={isLoading || !newImageUrl.trim()}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-24 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                {form.images.length} image{form.images.length !== 1 ? "s" : ""} added
              </p>
            </div>

            {/* Inventory & Status */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm">Inventory & Status</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU / Product Code</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="PROD-001"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={form.stock || ""}
                    onChange={(e) => setForm({ ...form, stock: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="0"
                    min="0"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val: "active" | "inactive" | "out_of_stock") => setForm({ ...form, status: val })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  disabled={isLoading}
                  className="rounded"
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured Product
                </Label>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm">Product Features</h3>
              
              <div className="grid gap-2">
                <Label>Add Feature</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="e.g., Waterproof, Wireless, Fast Charging"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addFeature}
                    disabled={isLoading || !newFeature.trim()}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {form.features && form.features.length > 0 && (
                <div className="space-y-2">
                  <Label>Features ({form.features.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {form.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{feature}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(idx)}
                          className="text-blue-700 hover:text-blue-900"
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-sm">Tags</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={form.tags?.join(", ") || ""}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Separate tags with commas for search and filtering
                </p>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Contact Information</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
                <Input
                  id="whatsapp"
                  value={form.whatsappNumber}
                  onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  Overrides seller default WhatsApp number
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : product
                ? "Update Product"
                : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
