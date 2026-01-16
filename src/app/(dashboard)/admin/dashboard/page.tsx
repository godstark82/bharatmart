"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Product } from "@/types/products";

async function fetchUserProducts(userId: string, role: string): Promise<Product[]> {
  const q = role === "admin"
    ? query(collection(db, "products"))
    : query(collection(db, "products"), where("sellerId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Product[];
}

export default function AdminDashboardPage() {
  const { user, role, userData } = useAuth();

  const { data: products = [] } = useQuery({
    queryKey: ["dashboard-products", user?.uid, role],
    queryFn: () => fetchUserProducts(user!.uid, role!),
    enabled: !!user?.uid && !!role,
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
            <CardTitle>Total Products</CardTitle>
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
            <p className="text-lg font-semibold capitalize">{role}</p>
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
