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
import { Input } from "@/components/ui/input";
import { useInquiry } from "@/lib/providers/InquiryProvider";
import { useCategories } from "@/lib/providers/CategoriesProvider";

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
  const searchQuery = searchParams.get("q") || "";
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({
    min: "",
    max: "",
  });

  const { categories } = useCategories();
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchAllProducts,
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
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-gray-600">Loading search results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-50">
      {/* Search Header */}
      <div className="shrink-0 border-b bg-white">
        <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for products..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="h-11 pl-10 pr-24 text-base sm:h-12 sm:pr-28 sm:text-lg"
              />
              <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2" size="sm">
                Search
              </Button>
            </form>
            {searchQuery && (
              <p className="mt-3 text-sm text-gray-600 sm:mt-4 sm:text-base">
                {filteredAndSortedProducts.length} result{filteredAndSortedProducts.length !== 1 ? "s" : ""} found for &quot;{searchQuery}&quot;
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto min-h-0 flex-1 flex flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {!searchQuery ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center sm:p-8">
                <SearchIcon className="mx-auto mb-4 size-12 text-gray-400 sm:size-16" />
                <h3 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg">Start your search</h3>
                <p className="text-sm text-gray-600 sm:text-base">
                  Enter a product name, category, or keyword to find what you&apos;re looking for.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-8">
            {/* Sidebar Filters */}
            <aside className="shrink-0 lg:w-64">
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
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Sort Bar */}
              <div className="mb-4 flex shrink-0 items-center justify-between sm:mb-6">
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-full sm:w-48">
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

              {/* Products Grid */}
              {filteredAndSortedProducts.length === 0 ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
                  <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center sm:p-8">
                      <Package className="mx-auto mb-4 size-12 text-gray-400 sm:size-16" />
                      <h3 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg">No products found</h3>
                      <p className="mb-4 text-sm text-gray-600 sm:text-base">
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
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
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
                            <div className="flex h-full w-full items-center justify-center bg-gray-200">
                              <Package className="size-12 text-gray-400" />
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
                            addItem({
                              productId: product.id,
                              title: product.title,
                              price: product.price,
                              image: product.images?.[0],
                              sellerId: product.sellerId,
                            })
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

    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-gray-600">Loading search...</p>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
