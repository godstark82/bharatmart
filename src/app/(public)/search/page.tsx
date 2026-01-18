"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Product } from "@/types/products";
import { Category } from "@/types/categories";
import { User } from "@/types/users";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingCart, Package, Filter, X, Search as SearchIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { Input } from "@/components/ui/input";
import { useInquiry } from "@/lib/providers/InquiryProvider";
import { useAuthGate } from "@/hooks/useAuthGate";

async function fetchAllProducts(): Promise<Product[]> {
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

async function fetchSellers(): Promise<User[]> {
  const q = query(collection(db, "users"), where("role", "==", "seller"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      uid: d.id,
      email: data.email,
      role: data.role,
      name: data.name,
      whatsappNumber: data.whatsappNumber,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as User;
  });
}

type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name-asc" | "name-desc";
type FilterOption = "all" | "in-stock" | "out-of-stock" | "featured";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useInquiry();
  const { ensureAuth, AuthDialog } = useAuthGate({
    title: "Sign in to add to cart",
    description: "Please sign in or create an account to add products to your cart.",
  });
  const searchQuery = searchParams.get("q") || "";
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchAllProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ["sellers"],
    queryFn: fetchSellers,
  });

  const sellerById = useMemo(() => {
    const map = new Map<string, User>();
    for (const s of sellers) map.set(s.uid, s);
    return map;
  }, [sellers]);

  // Update local search query when URL changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Filter products by search query
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return allProducts.filter((product) => {
      const titleMatch = product.title.toLowerCase().includes(query);
      const descriptionMatch = product.description?.toLowerCase().includes(query);
      const seller = sellerById.get(product.sellerId);
      const sellerNameMatch = (seller?.name || "").toLowerCase().includes(query);
      const categoryMatch = categories
        .find((c) => c.id === product.categoryId)
        ?.name.toLowerCase()
        .includes(query);
      const tagsMatch = product.tags?.some((tag) => tag.toLowerCase().includes(query));
      
      return titleMatch || descriptionMatch || sellerNameMatch || categoryMatch || tagsMatch;
    });
  }, [allProducts, searchQuery, categories, sellerById]);

  // Apply additional filters and sorting
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...filteredBySearch];

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    // Status filter
    if (filterBy === "in-stock") {
      filtered = filtered.filter(
        (p) => p.stock === undefined || p.stock === null || p.stock > 0
      );
    } else if (filterBy === "out-of-stock") {
      filtered = filtered.filter((p) => p.stock !== undefined && p.stock !== null && p.stock === 0);
    } else if (filterBy === "featured") {
      filtered = filtered.filter((p) => p.featured === true);
    }

    // Price range filter
    if (priceRange.min) {
      const min = parseFloat(priceRange.min);
      if (!isNaN(min)) {
        filtered = filtered.filter((p) => p.price >= min);
      }
    }
    if (priceRange.max) {
      const max = parseFloat(priceRange.max);
      if (!isNaN(max)) {
        filtered = filtered.filter((p) => p.price <= max);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        case "oldest":
          return a.createdAt.getTime() - b.createdAt.getTime();
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name-asc":
          return a.title.localeCompare(b.title);
        case "name-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [filteredBySearch, sortBy, filterBy, selectedCategory, priceRange]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(localSearchQuery.trim())}`);
    }
  };

  const clearFilters = () => {
    setFilterBy("all");
    setSelectedCategory("all");
    setPriceRange({ min: "", max: "" });
  };

  const hasActiveFilters =
    filterBy !== "all" || selectedCategory !== "all" || priceRange.min || priceRange.max;

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading search results...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-12 text-lg"
              />
              <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                Search
              </Button>
            </form>
            {searchQuery && (
              <p className="mt-4 text-gray-600">
                {filteredAndSortedProducts.length} result{filteredAndSortedProducts.length !== 1 ? "s" : ""} found for "
                {searchQuery}"
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!searchQuery ? (
          <Card>
            <CardContent className="p-12 text-center">
              <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start your search</h3>
              <p className="text-gray-600 mb-4">
                Enter a product name, category, or keyword to find what you're looking for.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filters
                    </h2>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Category
                      </label>
                      <Select
                        value={selectedCategory}
                        onValueChange={(value) => setSelectedCategory(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Status
                      </label>
                      <Select
                        value={filterBy}
                        onValueChange={(value) => setFilterBy(value as FilterOption)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="in-stock">In Stock</SelectItem>
                          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                          <SelectItem value="featured">Featured Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Price Range
                      </label>
                      <div className="space-y-2">
                        <input
                          type="number"
                          placeholder="Min price"
                          value={priceRange.min}
                          onChange={(e) =>
                            setPriceRange({ ...priceRange, min: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Max price"
                          value={priceRange.max}
                          onChange={(e) =>
                            setPriceRange({ ...priceRange, max: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Sort Bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name-asc">Name: A to Z</SelectItem>
                      <SelectItem value="name-desc">Name: Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Products Grid */}
              {filteredAndSortedProducts.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">
                      {hasActiveFilters
                        ? "Try adjusting your filters to see more products."
                        : `No products match "${searchQuery}". Try a different search term.`}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="group hover:shadow-lg transition-shadow overflow-hidden"
                    >
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
                          {(product.stock !== undefined && product.stock === 0) ||
                          product.status === "out_of_stock" ? (
                            <Badge variant="destructive" className="absolute top-2 right-2">
                              Out of Stock
                            </Badge>
                          ) : null}
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <Link href={`/product/${product.id}`}>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {product.title}
                          </h3>
                        </Link>
                        {sellerById.get(product.sellerId)?.name && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="mr-1">Seller:</span>
                            <Link
                              href={`/seller/${product.sellerId}`}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {sellerById.get(product.sellerId)!.name}
                            </Link>
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xl font-bold text-gray-900">
                              ₹{product.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
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
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {AuthDialog}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <MainNavbar />
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading search...</p>
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
