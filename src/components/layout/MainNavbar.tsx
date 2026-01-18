"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Category } from "@/types/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Menu,
  ShoppingBag,
  Search,
  User,
  LogOut,
  ShoppingCart,
  MapPin,
  ChevronDown,
} from "lucide-react";
import {
  detectAndSaveLocation,
  getLocationLabel,
  loadLocation,
  markAutoPrompted,
  saveLocation,
  wasAutoPrompted,
} from "@/lib/location";
import { useInquiry } from "@/lib/providers/InquiryProvider";

async function fetchCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Category[];
}

export function MainNavbar() {
  const { user, userData, isAuthenticated, logout } = useAuth();
  const { totalQty } = useInquiry();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const dashboardHref =
    userData?.role === "admin"
      ? "/admin/dashboard"
      : userData?.role === "seller"
        ? "/seller/dashboard"
        : "/login";

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    const loc = loadLocation();
    if (loc) {
      setPincode(loc.pincode || "");
      setCity(loc.city || "");
      setStateName(loc.state || "");
    }

    // Auto-request location permission (once) to prefill user's location.
    if (!loc && !wasAutoPrompted()) {
      markAutoPrompted();
      setDetectingLocation(true);
      detectAndSaveLocation()
        .then((detected) => {
          setPincode(detected.pincode || "");
          setCity(detected.city || "");
          setStateName(detected.state || "");
        })
        .catch(() => {
          // permission denied / unsupported / failed: user can still set manually
        })
        .finally(() => setDetectingLocation(false));
    }
  }, []);

  const locationLabel = useMemo(
    () => getLocationLabel({ pincode, city, state: stateName }),
    [pincode, city, stateName]
  );

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSaveLocation = () => {
    if (!pincode.trim()) {
      alert("Please enter pincode");
      return;
    }
    saveLocation({
      pincode: pincode.trim(),
      city: city.trim() || undefined,
      state: stateName.trim() || undefined,
      source: "manual",
      updatedAt: Date.now(),
    });
    setLocationOpen(false);
  };

  const handleUseCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      const detected = await detectAndSaveLocation();
      setPincode(detected.pincode || "");
      setCity(detected.city || "");
      setStateName(detected.state || "");
      // If reverse geocode succeeded, close the modal; otherwise leave it open for manual pincode entry.
      if (detected.pincode) setLocationOpen(false);
    } catch (e: any) {
      alert(e?.message || "Unable to fetch location. Please enter pincode manually.");
    } finally {
      setDetectingLocation(false);
    }
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10 text-sm">
            <p className="text-gray-700">Welcome to worldwide BharatMart!</p>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setLocationOpen(true)}
                className="flex items-center gap-1 text-gray-700 hover:text-blue-600 cursor-pointer"
              >
                <MapPin className="h-4 w-4" />
                <span>
                  Deliver to {locationLabel}
                  {detectingLocation ? " (detecting…)" : ""}
                </span>
              </button>
              <Link href="/nearby-sellers" className="text-gray-700 hover:text-blue-600">
                Nearby Sellers
              </Link>
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Track your order
              </Link>
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                All Offers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <ShoppingBag className="h-7 w-7 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-600">BharatMart</h1>
            </Link>
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search essentials, groceries and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 h-10"
                />
              </div>
            </form>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <Link href={dashboardHref}>
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      Dashboard
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <User className="h-4 w-4" />
                        <span className="hidden sm:inline">{userData?.name || user?.email}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      Sign Up/Sign In
                    </Button>
                  </Link>
                </>
              )}
              <Link href="/cart">
                <Button variant="ghost" size="sm" className="gap-2 relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="hidden sm:inline">Cart</span>
                  {totalQty > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] leading-none px-1.5 py-1 rounded-full">
                      {totalQty}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      {categories.length > 0 && (
        <div className="bg-white border-b  top-[104px] z-40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide h-12">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="flex items-center gap-1 text-gray-700 hover:text-blue-600 whitespace-nowrap font-medium text-sm transition-colors"
                >
                  {category.name}
                  <ChevronDown className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set your location</DialogTitle>
            <DialogDescription>
              Enter your area so we can show nearby sellers (by pincode).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={detectingLocation}
            >
              {detectingLocation ? "Fetching location..." : "Use current location"}
            </Button>
            <div className="grid gap-2">
              <Label htmlFor="bm-pincode">Pincode *</Label>
              <Input
                id="bm-pincode"
                inputMode="numeric"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 423651"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bm-city">City (optional)</Label>
              <Input
                id="bm-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Nashik"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bm-state">State (optional)</Label>
              <Input
                id="bm-state"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Maharashtra"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setLocationOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveLocation}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
