"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Product } from "@/types/products";
import { User } from "@/types/users";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Store } from "lucide-react";
import { useInquiry } from "@/lib/providers/InquiryProvider";
import { useAuthGate } from "@/hooks/useAuthGate";

async function fetchSeller(sellerId: string): Promise<User | null> {
  const docRef = doc(db, "users", sellerId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data() as any;
  return {
    uid: docSnap.id,
    email: data.email,
    name: data.name,
    role: data.role,
    whatsappNumber: data.whatsappNumber,
    createdAt: data.createdAt?.toDate?.() || new Date(),
  } as User;
}

async function fetchSellerProducts(sellerId: string): Promise<Product[]> {
  const q = query(collection(db, "products"), where("sellerId", "==", sellerId));
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.(),
    } as Product;
  });
  products.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
  return products;
}

export default function SellerPublicPage() {
  const params = useParams();
  const sellerId = params.id as string;
  const { addItem } = useInquiry();
  const { ensureAuth, AuthDialog } = useAuthGate({
    title: "Sign in to add to cart",
    description: "Please sign in or create an account to add products to your cart.",
  });

  const { data: seller, isLoading: sellerLoading } = useQuery({
    queryKey: ["public-seller", sellerId],
    queryFn: () => fetchSeller(sellerId),
    enabled: !!sellerId,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["public-seller-products", sellerId],
    queryFn: () => fetchSellerProducts(sellerId),
    enabled: !!sellerId,
  });

  const sellerDisplayName = useMemo(
    () => seller?.name || seller?.email || "Seller",
    [seller?.name, seller?.email]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <Store className="h-4 w-4" />
                <span>Seller</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {sellerLoading ? "Loading..." : sellerDisplayName}
              </h1>
              {/* Note: buyers do not chat sellers directly; checkout goes to BharatMart WhatsApp */}
            </div>
            <div className="flex-shrink-0">
              <Badge variant="secondary">
                {productsLoading ? "…" : `${products.length} product${products.length !== 1 ? "s" : ""}`}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <p className="text-gray-600">Loading products...</p>
            ) : products.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No products found for this seller.</p>
                <Link href="/" className="inline-block mt-4">
                  <Button variant="outline">Back to Home</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => {
                  return (
                    <Card key={product.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                      <Link href={`/product/${product.id}`}>
                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          {product.featured && (
                            <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <Link href={`/product/${product.id}`}>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {product.title}
                          </h3>
                        </Link>
                        <p className="text-xl font-bold text-gray-900 mb-3">
                          ₹{product.price.toLocaleString()}
                        </p>
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() =>
                            ensureAuth(() =>
                              addItem({
                                productId: product.id,
                                title: product.title,
                                price: product.price,
                                image: product.images?.[0],
                                sellerId: product.sellerId,
                              })
                            )
                          }
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {AuthDialog}
    </div>
  );
}

