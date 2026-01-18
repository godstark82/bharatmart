"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { useParams } from "next/navigation";
import db from "@/lib/firebase/firestore";
import { Product } from "@/types/products";
import { Category } from "@/types/categories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle2,
  Package,
  Tag,
  Star,
  Share2,
  Heart,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { useInquiry } from "@/lib/providers/InquiryProvider";

async function fetchProduct(id: string): Promise<Product | null> {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate(),
  } as Product;
}

async function fetchCategory(id: string): Promise<Category | null> {
  const docRef = doc(db, "categories", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
  } as Category;
}

async function fetchSeller(uid: string) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data();
}

async function fetchRelatedProducts(categoryId: string, currentProductId: string): Promise<Product[]> {
  const q = query(
    collection(db, "products"),
    where("categoryId", "==", categoryId),
    limit(4)
  );
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Product[];
  return products.filter((p) => p.id !== currentProductId).slice(0, 3);
}

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useInquiry();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: !!productId,
  });

  const { data: category } = useQuery({
    queryKey: ["category", product?.categoryId],
    queryFn: () => fetchCategory(product!.categoryId),
    enabled: !!product?.categoryId,
  });

  const { data: seller } = useQuery({
    queryKey: ["seller", product?.sellerId],
    queryFn: () => fetchSeller(product!.sellerId),
    enabled: !!product?.sellerId,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["relatedProducts", product?.categoryId, productId],
    queryFn: () => fetchRelatedProducts(product!.categoryId, productId),
    enabled: !!product?.categoryId && !!productId,
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const currentImage = product?.images?.[selectedImageIndex] || product?.images?.[0];

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sellerName = (seller as any)?.name || (seller as any)?.email || "Seller";

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <span>/</span>
            {category && (
              <>
                <Link href={`/category/${category.id}`} className="hover:text-blue-600">
                  {category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-900 font-medium line-clamp-1">{product.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Images */}
          <div className="space-y-4">
            {product.images && product.images.length > 0 ? (
              <>
                {/* Main Image */}
                <div className="relative w-full aspect-square bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 group">
                  <Image
                    src={currentImage || product.images[0]}
                    alt={`${product.title} - Product image ${selectedImageIndex + 1}`}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  {/* Navigation arrows for multiple images */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex(
                            selectedImageIndex > 0
                              ? selectedImageIndex - 1
                              : product.images.length - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="h-5 w-5 text-gray-700" />
                      </button>
                      <button
                        onClick={() =>
                          setSelectedImageIndex(
                            selectedImageIndex < product.images.length - 1
                              ? selectedImageIndex + 1
                              : 0
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Next image"
                      >
                        <ChevronRight className="h-5 w-5 text-gray-700" />
                      </button>
                    </>
                  )}
                  {/* Image counter */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs">
                      {selectedImageIndex + 1} / {product.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                    {product.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === idx
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${product.title} - Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No Image Available</p>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Header with badges and actions */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {category && (
                    <Link href={`/category/${category.id}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-blue-200">
                        {category.name}
                      </Badge>
                    </Link>
                  )}
                  {product.featured && (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {(product.stock !== undefined && product.stock === 0) ||
                  product.status === "out_of_stock" ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : (
                    product.stock !== undefined && (
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        In Stock
                      </Badge>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={isWishlisted ? "text-red-500" : ""}
                  >
                    <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {product.title}
              </h1>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl lg:text-5xl font-bold text-blue-600">
                    ₹{product.price.toLocaleString()}
                  </span>
                </div>
                {product.sku && (
                  <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                )}
              </div>

              {/* Seller */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Sold by:</span>
                <Link
                  href={`/seller/${product.sellerId}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {sellerName}
                </Link>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-gray-200">
                <CardContent className="pt-4 pb-4 text-center">
                  <Truck className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Free Delivery</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardContent className="pt-4 pb-4 text-center">
                  <RotateCcw className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Easy Returns</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardContent className="pt-4 pb-4 text-center">
                  <Shield className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Secure Payment</p>
                </CardContent>
              </Card>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {product.description && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cart CTA */}
            <div className="pt-4 space-y-3">
              <Button
                size="lg"
                className="w-full text-lg py-6"
                onClick={() =>
                  addItem({
                    productId: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.images?.[0],
                    sellerId: product.sellerId,
                  })
                }
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Link href="/cart" className="block">
                <Button size="lg" variant="outline" className="w-full text-lg py-6">
                  View Cart & Checkout
                </Button>
              </Link>
              <p className="text-xs text-gray-500 text-center">
                Checkout sends your cart to BharatMart WhatsApp (not directly to seller).
              </p>
            </div>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Features & Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Features */}
            {product.features && product.features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {product.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    Product Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.sku && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">SKU</p>
                    <p className="font-medium">{product.sku}</p>
                  </div>
                )}
                {product.stock !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Stock Availability</p>
                    <p className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
                    </p>
                  </div>
                )}
                {product.status && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <Badge
                      variant={
                        product.status === "active"
                          ? "default"
                          : product.status === "out_of_stock"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {product.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                )}
                {category && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Category</p>
                    <Link href={`/category/${category.id}`}>
                      <p className="font-medium text-blue-600 hover:text-blue-700">
                        {category.name}
                      </p>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Related Products</h2>
              {category && (
                <Link
                  href={`/category/${category.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View all in {category.name} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/product/${relatedProduct.id}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="relative aspect-square bg-gray-100">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <Image
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {relatedProduct.title}
                      </h3>
                      <p className="text-lg font-bold text-blue-600">
                        ₹{relatedProduct.price.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
