"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Store } from "lucide-react";
import { User } from "@/types/users";
import { loadLocation } from "@/lib/location";

async function fetchNearbySellers(pincode: string): Promise<User[]> {
  const q = query(
    collection(db, "users"),
    where("role", "==", "seller"),
    where("pincode", "==", pincode)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      uid: d.id,
      email: data.email,
      role: data.role,
      name: data.name,
      whatsappNumber: data.whatsappNumber,
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as User;
  });
}

export default function NearbySellersPage() {
  const [pincode, setPincode] = useState<string>("");

  useEffect(() => {
    const loc = loadLocation();
    setPincode(loc?.pincode || "");
  }, []);

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["nearby-sellers", pincode],
    queryFn: () => fetchNearbySellers(pincode),
    enabled: !!pincode,
  });

  const title = useMemo(() => {
    if (!pincode) return "Nearby Sellers";
    return `Nearby Sellers in ${pincode}`;
  }, [pincode]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <MapPin className="h-4 w-4" />
            <span>Location-based sellers</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-2">
            Set your pincode from the top bar (“Deliver to …”) to see sellers near you.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!pincode ? (
          <Card>
            <CardContent className="p-10 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Location not set</p>
              <p className="text-sm text-gray-600 mt-1">
                Click “Deliver to …” in the top bar and enter your pincode.
              </p>
              <Link href="/" className="inline-block mt-4">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-gray-600">Loading nearby sellers...</p>
            </CardContent>
          </Card>
        ) : sellers.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">No sellers found</p>
              <p className="text-sm text-gray-600 mt-1">
                No sellers have set their location for pincode {pincode} yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellers.map((s) => (
              <Card key={s.uid} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between gap-3">
                    <span className="truncate">{s.name || s.email}</span>
                    <Badge variant="secondary">{s.pincode}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(s.city || s.state) && (
                    <p className="text-sm text-gray-600">
                      {[s.city, s.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <Link href={`/seller/${s.uid}`} className="block">
                    <Button className="w-full">View Seller Products</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

