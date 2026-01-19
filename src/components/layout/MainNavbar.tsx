"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Menu,
  ShoppingBag,
  Search,
  User,
  LogOut,
  LayoutDashboard,
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
import { useCategories } from "@/lib/providers/CategoriesProvider";

export function MainNavbar() {
  const { user, userData, isAuthenticated, logout, isAdmin, isSeller, loading: authLoading } = useAuth();
  const { totalQty } = useInquiry();
  const { categories } = useCategories();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Full address fields (buyer delivery address)
  const [houseNo, setHouseNo] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [blockNo, setBlockNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [country, setCountry] = useState("India");
  const [isDefaultAddress, setIsDefaultAddress] = useState(true);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showDeliveryInstructions, setShowDeliveryInstructions] = useState(false);

  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const dashboardHref =
    userData?.role === "admin"
      ? "/admin/dashboard"
      : userData?.role === "seller"
        ? "/seller/dashboard"
        : "/";

  useEffect(() => {
    const loc = loadLocation();
    if (loc) {
      setHouseNo(loc.houseNo || "");
      setFloorNo(loc.floorNo || "");
      setBlockNo(loc.blockNo || "");
      setBuildingName(loc.buildingName || "");
      setArea(loc.area || "");
      setLandmark(loc.landmark || "");
      setCountry(loc.country || "India");
      setIsDefaultAddress(loc.isDefaultAddress ?? true);
      setDeliveryInstructions(loc.deliveryInstructions || "");
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

  const INDIAN_STATES = useMemo(
    () => [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",
      "Andaman and Nicobar Islands",
      "Chandigarh",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Delhi",
      "Jammu and Kashmir",
      "Ladakh",
      "Lakshadweep",
      "Puducherry",
    ],
    []
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
    if (!houseNo.trim()) {
      alert("Please enter House/Flat/Shop No.");
      return;
    }
    if (!area.trim()) {
      alert("Please enter Area / Locality");
      return;
    }
    if (!pincode.trim()) {
      alert("Please enter Pincode");
      return;
    }
    if (!city.trim()) {
      alert("Please enter City");
      return;
    }
    if (!stateName.trim()) {
      alert("Please enter State");
      return;
    }
    saveLocation({
      houseNo: houseNo.trim(),
      floorNo: floorNo.trim() || undefined,
      blockNo: blockNo.trim() || undefined,
      buildingName: buildingName.trim() || undefined,
      area: area.trim(),
      landmark: landmark.trim() || undefined,
      country: (country || "India").trim() || undefined,
      isDefaultAddress,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      pincode: pincode.trim(),
      city: city.trim(),
      state: stateName.trim(),
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
    } catch (e: any) {
      alert(e?.message || "Unable to fetch location. Please enter pincode manually.");
    } finally {
      setDetectingLocation(false);
    }
  };

  return (
    <>
      {/* Top Bar - hidden on mobile to save space */}
      <div className="hidden md:block bg-blue-50 border-b border-blue-100">
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
        <div className="container mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4 h-14 sm:h-16">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden shrink-0" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <nav className="flex flex-col pt-14 pb-6">
                  <div className="px-4 pb-4 border-b space-y-1">
                    <button
                      type="button"
                      onClick={() => { setLocationOpen(true); setMobileMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-left rounded-md hover:bg-gray-100"
                    >
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Set location
                    </button>
                    <Link href="/search" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-md hover:bg-gray-100">
                      <Search className="h-4 w-4 text-gray-500" />
                      Search
                    </Link>
                    <Link href="/nearby-sellers" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-gray-100">Nearby Sellers</Link>
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-gray-100">Track your order</Link>
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-gray-100">All Offers</Link>
                  </div>
                  <div className="px-4 py-4 border-b space-y-1">
                    {!isAuthenticated ? (
                      <>
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm font-medium rounded-md hover:bg-gray-100">Sign in</Link>
                        <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-gray-100">Sign up</Link>
                      </>
                    ) : (
                      <>
                        <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-gray-100">My Profile</Link>
                        {(isAdmin || isSeller) && (
                          <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm rounded-md hover:bg-gray-100">Dashboard</Link>
                        )}
                        <button type="button" onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="block w-full text-left px-3 py-2.5 text-sm text-red-600 rounded-md hover:bg-red-50">Logout</button>
                      </>
                    )}
                  </div>
                  {categories.length > 0 && (
                    <div className="px-4 py-4">
                      <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categories</p>
                      <div className="mt-1 space-y-0.5">
                        {categories.map((cat) => (
                          <Link key={cat.id} href={`/category/${cat.id}`} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100">
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-blue-600">BharatMart</h1>
            </Link>
            <div className="flex-1 min-w-0 md:hidden" />
            <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-2xl mx-2 lg:mx-4 hidden md:block">
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
            <Link href="/search" className="md:hidden p-2 shrink-0 text-gray-600 hover:text-blue-600" aria-label="Search">
              <Search className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-1 sm:gap-4 shrink-0">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{userData?.name || user?.email}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      {userData?.name || user?.email || "Account"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(isAdmin || isSeller) && (
                      <DropdownMenuItem asChild>
                        <Link href={dashboardHref} className="flex items-center w-full">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="hidden sm:flex">
                      Sign Up/Sign In
                    </Button>
                  </Link>
                </>
              )}
              {authLoading ? (
                <Button variant="ghost" size="sm" className="gap-2 relative" type="button" disabled>
                  <ShoppingCart className="h-5 w-5" />
                  <span className="hidden sm:inline">Cart</span>
                </Button>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Navigation */}
      {categories.length > 0 && (
        <div className="bg-white border-b z-40 overflow-x-auto">
          <div className="container mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide h-12 min-w-0">
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
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set your location</DialogTitle>
            <DialogDescription>
              Enter your address so we can show nearby sellers and include it in checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Button type="button" variant="ghost" className="justify-start px-0 text-blue-600 hover:text-blue-700">
              <MapPin className="mr-2 h-4 w-4" />
              Add location on map (coming soon)
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={detectingLocation}
            >
              {detectingLocation ? "Fetching location..." : "Use current location"}
            </Button>

            <div className="grid gap-2">
              <Label htmlFor="bm-houseNo">Flat, House no., Building, Company, Apartment *</Label>
              <Input
                id="bm-houseNo"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="Enter details"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bm-area">Area, Street, Sector, Village *</Label>
              <Input
                id="bm-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Enter details"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bm-landmark">Landmark</Label>
              <Input
                id="bm-landmark"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="E.g. near apollo hospital"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bm-pincode">Pincode</Label>
                <Input
                  id="bm-pincode"
                  inputMode="numeric"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="6-digit Pincode"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bm-city">Town/City</Label>
                <Input
                  id="bm-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter town/city"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>State</Label>
              <Select value={stateName} onValueChange={(v) => setStateName(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button
              type="button"
              onClick={() => setShowMoreDetails((v) => !v)}
              className="text-left text-sm text-blue-600 hover:text-blue-700"
            >
              {showMoreDetails ? "Hide address details" : "Add more address details (optional)"}
            </button>

            {showMoreDetails && (
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bm-floorNo">Floor No. (optional)</Label>
                    <Input
                      id="bm-floorNo"
                      value={floorNo}
                      onChange={(e) => setFloorNo(e.target.value)}
                      placeholder="e.g. 3"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bm-blockNo">Block No. (optional)</Label>
                    <Input
                      id="bm-blockNo"
                      value={blockNo}
                      onChange={(e) => setBlockNo(e.target.value)}
                      placeholder="e.g. A"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="bm-buildingName">Building / Society (optional)</Label>
                  <Input
                    id="bm-buildingName"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="e.g. Green Heights"
                  />
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={isDefaultAddress}
                onChange={(e) => setIsDefaultAddress(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              Make this my default address
            </label>

            <button
              type="button"
              onClick={() => setShowDeliveryInstructions((v) => !v)}
              className="flex items-center justify-between text-left text-sm text-gray-800 border-t pt-3"
            >
              <span className="font-medium">Delivery instructions (optional)</span>
              <span className="text-gray-500">{showDeliveryInstructions ? "▲" : "›"}</span>
            </button>
            {showDeliveryInstructions && (
              <div className="grid gap-2">
                <Label htmlFor="bm-deliveryInstructions" className="text-xs text-gray-500">
                  Notes, preferences and more
                </Label>
                <Textarea
                  id="bm-deliveryInstructions"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Call before delivery, leave at security, etc."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setLocationOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveLocation} className="bg-yellow-400 text-black hover:bg-yellow-500">
              Use this address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
