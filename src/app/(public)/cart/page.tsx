"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingCart } from "lucide-react";
import { useInquiry } from "@/lib/providers/InquiryProvider";
import { buildWhatsAppCheckoutUrl } from "@/lib/whatsappCheckout";
import { useAuthGate } from "@/hooks/useAuthGate";
import { useAuth } from "@/hooks/useAuth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { loadLocation } from "@/lib/location";

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, totalAmount, totalQty } = useInquiry();
  const { openAuthDialog, AuthDialog } = useAuthGate({
    title: "Sign in to checkout",
    description: "Please sign in or create an account to complete your order.",
  });
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!user) {
      openAuthDialog();
      return;
    }

    // Create an order record so it shows up in "Previous orders".
    // (We still send the checkout to WhatsApp.)
    try {
      const loc = loadLocation();
      const orderRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        status: "placed",
        items,
        totalQty,
        totalAmount,
        deliveryAddress: loc || null,
        createdAt: serverTimestamp(),
      });
      // NOTE: WhatsApp URL only supports the "text" query param; orderRef.id is stored in Firestore for history.
      const url = buildWhatsAppCheckoutUrl(items);
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    } catch {
      // Fall back to WhatsApp checkout even if order write fails.
    }
    const url = buildWhatsAppCheckoutUrl(items);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cart</h1>
              <p className="text-sm text-gray-600 mt-1">{totalQty} item{totalQty !== 1 ? "s" : ""}</p>
            </div>
            {items.length > 0 && (
              <Button variant="outline" onClick={clearCart}>
                Clear cart
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length === 0 ? (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 md:p-10">
              <div className="w-full md:w-[420px] flex justify-center">
                <Image
                  src="/cart-empty.svg"
                  alt="Empty cart illustration"
                  width={420}
                  height={220}
                  className="h-auto w-full max-w-[420px]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Your BharatMart Cart is empty
                </h1>
                <Link href="/" className="inline-block mt-2 text-blue-600 hover:text-blue-700">
                  Shop today's deals
                </Link>
                <div className="mt-6">
                  <Link href="/">
                    <Button>Continue shopping</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.productId}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/product/${item.productId}`} className="font-semibold text-gray-900 hover:text-blue-600">
                        {item.title}
                      </Link>
                      <p className="text-sm text-gray-600">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => updateQty(item.productId, Number(e.target.value))}
                        className="w-20"
                      />
                      <Button variant="outline" size="icon" onClick={() => removeItem(item.productId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Items</span>
                  <span className="font-medium">{totalQty}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold">₹{totalAmount}</span>
                </div>
                <Button className="w-full" onClick={handleCheckout}>
                  Checkout on WhatsApp
                </Button>
                <p className="text-xs text-gray-500">
                  Your cart will be sent to <span className="font-medium">9983944688</span> on WhatsApp.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {AuthDialog}
    </div>
  );
}

