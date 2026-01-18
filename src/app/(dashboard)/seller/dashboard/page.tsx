"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Product } from "@/types/products";

async function fetchSellerProducts(sellerId: string): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("sellerId", "==", sellerId)
  );
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Product[];

  // Avoid Firestore composite-index requirements by sorting client-side.
  products.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
  return products;
}

export default function SellerDashboardPage() {
  const { user, userData } = useAuth();

  const { data: products = [] } = useQuery({
    queryKey: ["seller-dashboard-products", user?.uid],
    queryFn: () => fetchSellerProducts(user!.uid),
    enabled: !!user?.uid,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {userData?.name || user?.email}!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{products.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold capitalize">
              {userData?.role || "seller"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

