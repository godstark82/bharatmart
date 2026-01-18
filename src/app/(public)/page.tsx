"use client";

import { useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Product } from "@/types/products";
import { Category } from "@/types/categories";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Download,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { useInquiry } from "@/lib/providers/InquiryProvider";
import { useAuthGate } from "@/hooks/useAuthGate";

async function fetchProducts(): Promise<Product[]> {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
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

function ProductCarousel({ products, title, getCategoryName }: { products: Product[]; title: string; getCategoryName: (id: string) => string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem } = useInquiry();

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          View All &gt;
        </Link>
      </div>
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
            >
              <Link href={`/product/${product.id}`}>
                <div className="relative h-48 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={`${product.title} - Product image`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="256px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <ShoppingBag className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    50% OFF
                  </div>
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-blue-600">₹{product.price}</span>
                  <span className="text-sm text-gray-500 line-through">₹{product.price * 2}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    addItem({
                      productId: product.id,
                      title: product.title,
                      price: product.price,
                      image: product.images?.[0],
                      sellerId: product.sellerId,
                    });
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

function CategoryIcons({ categories }: { categories: Category[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (categories.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">Shop From Top Categories</h2>
        <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
          View All &gt;
        </Link>
      </div>
      <div className="relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth px-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/?category=${category.id}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-colors shadow-md overflow-hidden">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 text-center max-w-[80px]">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { addItem } = useInquiry();
  const { ensureAuth, AuthDialog } = useAuthGate({
    title: "Sign in to add to cart",
    description: "Please sign in or create an account to add products to your cart.",
  });
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || "Uncategorized";
  };

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};
    products.forEach((product) => {
      const catId = product.categoryId || "uncategorized";
      if (!grouped[catId]) {
        grouped[catId] = [];
      }
      grouped[catId].push(product);
    });
    return grouped;
  }, [products]);

  // Category descriptions (random text for each category)
  const categoryDescriptions: Record<string, string> = {
    default: "Discover amazing deals and premium quality products",
    electronics: "Latest technology at unbeatable prices",
    fashion: "Trendy styles and fashionable designs",
    home: "Transform your living space with our collection",
    beauty: "Enhance your natural beauty with premium products",
    sports: "Gear up for your active lifestyle",
    books: "Expand your knowledge with our vast collection",
    toys: "Fun and educational toys for all ages",
  };

  const getCategoryDescription = (categoryName: string) => {
    const key = categoryName.toLowerCase().replace(/\s+/g, "");
    return categoryDescriptions[key] || categoryDescriptions.default;
  };

  return (
    <div className="min-h-screen bg-white">
      <MainNavbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-8 md:p-12">
              <div className="flex-1">
                <p className="text-blue-200 text-sm mb-2">Best Deal Online on smart watches</p>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">SMART WEARABLE</h2>
                <p className="text-2xl md:text-3xl font-bold text-yellow-300 mb-6">UP to 80% OFF</p>
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Shop Now
                </Button>
              </div>
              <div className="hidden md:block flex-shrink-0">
                <div className="w-64 h-64 bg-white/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-32 w-32 text-white/30" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/50"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {productsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading products...</p>
          </div>
        ) : (
          <>
            {/* Category Sections */}
            {categories.map((category) => {
              const categoryProducts = productsByCategory[category.id] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} className="mb-16">
                  {/* Category Header */}
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      Best deal on {category.name}
                    </h2>
                    <p className="text-gray-600 text-lg">
                      {getCategoryDescription(category.name)}. Explore our curated selection of premium {category.name.toLowerCase()} products.
                    </p>
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                    {categoryProducts.slice(0, 6).map((product) => (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                      >
                        <Link href={`/product/${product.id}`}>
                          <div className="relative h-40 bg-gray-100">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={`${product.title} - Product image`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <ShoppingBag className="h-12 w-12" />
                              </div>
                            )}
                            {product.featured && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                                Featured
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="p-3 space-y-2">
                          <Link href={`/product/${product.id}`}>
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                              {product.title}
                            </p>
                          </Link>
                          <p className="text-lg font-bold text-blue-600">₹{product.price.toLocaleString()}</p>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.preventDefault();
                              ensureAuth(() =>
                                addItem({
                                  productId: product.id,
                                  title: product.title,
                                  price: product.price,
                                  image: product.images?.[0],
                                  sellerId: product.sellerId,
                                })
                              );
                            }}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View More Link */}
                  {categoryProducts.length > 6 && (
                    <div className="text-center">
                      <Link
                        href={`/category/${category.id}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View more {category.name} products
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Contact Us */}
            <div>
              <h3 className="text-xl font-bold mb-4">BharatMart</h3>
              <div className="space-y-3">
                <p className="font-semibold">Contact Us</p>
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp: 9983944688</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>Call: 9983944688</span>
                </div>
                <div className="mt-4">
                  <p className="font-semibold mb-2">Download App</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Download className="h-4 w-4 mr-2" />
                      App Store
                    </Button>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Download className="h-4 w-4 mr-2" />
                      Google Play
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Popular Categories */}
            <div>
              <h3 className="text-xl font-bold mb-4">Most Popular Categories</h3>
              <ul className="space-y-2 text-sm">
                {categories.slice(0, 8).map((category) => (
                  <li key={category.id}>
                    <Link href={`/category/${category.id}`} className="hover:text-blue-200">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Services */}
            <div>
              <h3 className="text-xl font-bold mb-4">Customer Services</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-blue-200">About Us</Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-blue-200">Terms & Conditions</Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-blue-200">FAQ</Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-blue-200">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-blue-200">Cancellation & Return Policy</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 pt-6 text-center text-sm text-blue-200">
            <p>© 2026 All rights reserved. BharatMart Ltd.</p>
          </div>
        </div>
      </footer>

      {AuthDialog}
    </div>
  );
}
