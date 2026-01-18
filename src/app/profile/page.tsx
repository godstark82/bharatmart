"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { MainNavbar } from "@/components/layout/MainNavbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, MapPin, Package, Save } from "lucide-react";
import { detectAndSaveLocation, saveLocation } from "@/lib/location";
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from "firebase/auth";
import auth from "@/lib/firebase/auth";
import type { Order } from "@/types/orders";

const INDIAN_STATES = [
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
];

async function fetchOrders(userId: string): Promise<Order[]> {
  const q = query(collection(db, "orders"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      userId: data.userId,
      status: data.status || "placed",
      items: Array.isArray(data.items) ? data.items : [],
      totalQty: Number(data.totalQty) || 0,
      totalAmount: Number(data.totalAmount) || 0,
      deliveryAddress: data.deliveryAddress || null,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    } as Order;
  });
  orders.sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
  return orders;
}

export default function ProfilePage() {
  const { user, userData, loading: authLoading, refreshUserData, isSeller, isAdmin } = useAuth();
  const router = useRouter();

  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Account
  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Seller-only business fields
  const [businessName, setBusinessName] = useState("");
  const [shopNo, setShopNo] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  // Address fields (buyer + seller)
  const [houseNo, setHouseNo] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [floorNo, setFloorNo] = useState("");
  const [blockNo, setBlockNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("India");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);

  // Email update
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [emailMsg, setEmailMsg] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!userData) return;
    setName(userData.name || "");
    setWhatsappNumber(userData.whatsappNumber || "");
    setBusinessName(userData.businessName || "");
    setShopNo(userData.shopNo || "");
    setGstNumber(userData.gstNumber || "");

    setHouseNo(userData.houseNo || "");
    setArea(userData.area || "");
    setLandmark(userData.landmark || "");
    setFloorNo(userData.floorNo || "");
    setBlockNo(userData.blockNo || "");
    setBuildingName(userData.buildingName || "");
    setPincode(userData.pincode || "");
    setCity(userData.city || "");
    setStateName(userData.state || "");
    setCountry(userData.country || "India");
  }, [userData]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", user?.uid],
    queryFn: () => fetchOrders(user!.uid),
    enabled: !!user?.uid,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        whatsappNumber: whatsappNumber.trim() || "",

        // seller-only fields (safe to store for buyers too; kept empty)
        businessName: businessName.trim() || "",
        shopNo: shopNo.trim() || "",
        gstNumber: gstNumber.trim() || "",

        // address
        houseNo: houseNo.trim() || "",
        area: area.trim() || "",
        landmark: landmark.trim() || "",
        floorNo: floorNo.trim() || "",
        blockNo: blockNo.trim() || "",
        buildingName: buildingName.trim() || "",
        pincode: pincode.trim() || "",
        city: city.trim() || "",
        state: stateName.trim() || "",
        country: country.trim() || "India",
        locationLat: typeof locationLat === "number" ? locationLat : null,
        locationLng: typeof locationLng === "number" ? locationLng : null,
      });

      // Also keep local delivery address in sync for checkout.
      saveLocation({
        houseNo: houseNo.trim() || undefined,
        floorNo: floorNo.trim() || undefined,
        blockNo: blockNo.trim() || undefined,
        buildingName: buildingName.trim() || undefined,
        area: area.trim() || undefined,
        landmark: landmark.trim() || undefined,
        country: country.trim() || undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        pincode: pincode.trim() || undefined,
        city: city.trim() || undefined,
        state: stateName.trim() || undefined,
        lat: typeof locationLat === "number" ? locationLat : undefined,
        lng: typeof locationLng === "number" ? locationLng : undefined,
        source: "manual",
        updatedAt: Date.now(),
      });
    },
    onSuccess: async () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      await refreshUserData();
    },
  });

  const canSave = useMemo(() => {
    if (!name.trim()) return false;
    if (isSeller && !shopNo.trim()) return false;
    // address optional, but if any field filled, enforce minimum useful set
    const anyAddress = !!(houseNo || area || pincode || city || stateName);
    if (!anyAddress) return true;
    return !!(houseNo.trim() && area.trim() && pincode.trim() && city.trim() && stateName.trim());
  }, [name, isSeller, shopNo, houseNo, area, pincode, city, stateName]);

  const handleUseCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      const detected = await detectAndSaveLocation();
      setPincode(detected.pincode || "");
      setCity(detected.city || "");
      setStateName(detected.state || "");
      setLocationLat(typeof detected.lat === "number" ? detected.lat : null);
      setLocationLng(typeof detected.lng === "number" ? detected.lng : null);
    } catch (e: any) {
      alert(e?.message || "Unable to fetch location. Please enter manually.");
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Name is required");
    if (isSeller && !shopNo.trim()) return alert("Shop No. is required for sellers");
    const anyAddress = !!(houseNo || area || pincode || city || stateName);
    if (anyAddress) {
      if (!houseNo.trim()) return alert("House/Flat/Shop No. is required");
      if (!area.trim()) return alert("Area / Locality is required");
      if (!pincode.trim()) return alert("Pincode is required");
      if (!city.trim()) return alert("City is required");
      if (!stateName.trim()) return alert("State is required");
    }
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync();
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    setEmailMsg("");
    const fbUser = auth.currentUser;
    if (!fbUser || !fbUser.email) return;
    if (!newEmail.trim()) return setEmailMsg("Enter a new email address.");
    if (!currentPassword) return setEmailMsg("Enter your current password to confirm.");

    try {
      const credential = EmailAuthProvider.credential(fbUser.email, currentPassword);
      await reauthenticateWithCredential(fbUser, credential);
      await updateEmail(fbUser, newEmail.trim());
      await updateDoc(doc(db, "users", fbUser.uid), { email: newEmail.trim() });
      setEmailMsg("Email updated successfully.");
      setNewEmail("");
      setCurrentPassword("");
      await refreshUserData();
    } catch (e: any) {
      setEmailMsg(e?.message || "Unable to update email. Please try again.");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your account, address, and orders.</p>
          </div>
          <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Saved successfully.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Basic account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email || ""} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp Number (optional)</Label>
                  <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
                </div>
                {(isSeller || isAdmin) && (
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">Business (Seller)</p>
                      <p className="text-xs text-gray-500">Shop No. required for sellers.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-2">
                        <Label>Shop / Business Name (optional)</Label>
                        <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Shop No. *</Label>
                        <Input value={shopNo} onChange={(e) => setShopNo(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>GST Number (optional)</Label>
                      <Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value.toUpperCase())} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
                <CardDescription>Add or update your address for checkout and nearby sellers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingLocation}
                  className="gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  {detectingLocation ? "Fetching location..." : "Use current location (fill pincode/city/state)"}
                </Button>

                <div className="space-y-2">
                  <Label>Flat, House no., Building, Company, Apartment</Label>
                  <Input value={houseNo} onChange={(e) => setHouseNo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Area, Street, Sector, Village</Label>
                  <Input value={area} onChange={(e) => setArea(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Landmark (optional)</Label>
                  <Input value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input inputMode="numeric" value={pincode} onChange={(e) => setPincode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Town/City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
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
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Floor No. (optional)</Label>
                    <Input value={floorNo} onChange={(e) => setFloorNo(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Block No. (optional)</Label>
                    <Input value={blockNo} onChange={(e) => setBlockNo(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Building / Society (optional)</Label>
                    <Input value={buildingName} onChange={(e) => setBuildingName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Delivery instructions (optional)</Label>
                  <Textarea
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    placeholder="e.g. Call before delivery, leave at security, etc."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update Email</CardTitle>
                <CardDescription>Requires your current password (Firebase security).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>New Email</Label>
                  <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@newmail.com" />
                </div>
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>
                {emailMsg && <p className="text-sm text-gray-600">{emailMsg}</p>}
                <Button type="button" variant="outline" onClick={handleEmailUpdate}>
                  Update Email
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle id="orders" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Previous Orders
                </CardTitle>
                <CardDescription>Your recent checkouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ordersLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading orders...
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-gray-600">No orders yet.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 10).map((o) => (
                      <div key={o.id} className="rounded-md border p-3 bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">Order #{o.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-500">
                              {o.createdAt?.toLocaleString?.() || "—"} • {o.status}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">₹{o.totalAmount}</p>
                            <p className="text-xs text-gray-500">{o.totalQty} items</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

