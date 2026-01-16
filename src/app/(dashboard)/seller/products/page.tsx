"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
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
import { Button } from "@/components/ui/button";
import { ProductDialog } from "@/components/admin/ProductDialog";
import { Plus, Edit, Trash } from "lucide-react";

async function fetchSellerProducts(sellerId: string): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Product[];
}

async function fetchCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Category[];
}

export default function SellerProductsPage() {
  const { isSeller, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["seller-products", user?.uid],
    queryFn: () => fetchSellerProducts(user!.uid),
    enabled: !!user?.uid && isSeller,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "products", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  useEffect(() => {
    if (!authLoading && !isSeller) {
      router.push("/");
    }
  }, [isSeller, authLoading, router]);

  if (authLoading || !isSeller || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Products</h1>
          <p className="text-sm text-gray-500">
            Manage your product listings here.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <p className="text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500">No products yet. Add your first product!</p>
          ) : (
            <div className="space-y-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center rounded-lg border p-4"
                >
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{p.price} · {getCategoryName(p.categoryId)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(p)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this product?")) {
                          deleteProductMutation.mutate(p.id);
                        }
                      }}
                      disabled={deleteProductMutation.isPending}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
          }
        }}
        product={editingProduct}
        categories={categories}
        sellerId={user.uid}
      />
    </div>
  );
}
