"use client";

import Link from "next/link";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingCart } from "lucide-react";
import { useInquiry } from "@/lib/providers/InquiryProvider";
import { buildWhatsAppCheckoutUrl } from "@/lib/whatsappCheckout";

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, totalAmount, totalQty } = useInquiry();

  const handleCheckout = () => {
    if (items.length === 0) return;
    const url = buildWhatsAppCheckoutUrl(items);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

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
          <Card>
            <CardContent className="p-10 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-600 mt-1">Add products to checkout on WhatsApp.</p>
              <Link href="/" className="inline-block mt-4">
                <Button>Continue shopping</Button>
              </Link>
            </CardContent>
          </Card>
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
    </div>
  );
}

