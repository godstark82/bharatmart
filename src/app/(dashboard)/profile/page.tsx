"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, updateDoc } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { detectAndSaveLocation, loadLocation } from "@/lib/location";

export default function ProfilePage() {
  const { user, userData, loading: authLoading, isAdmin, isSeller, refreshUserData } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || (!isAdmin && !isSeller)) {
        router.push("/login");
        return;
      }
      if (userData) {
        setName(userData.name || "");
        setWhatsappNumber(userData.whatsappNumber || "");
        setPincode(userData.pincode || "");
        setCity(userData.city || "");
        setState(userData.state || "");
      }
    }
  }, [authLoading, user, isAdmin, isSeller, userData, router]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; whatsappNumber: string; pincode: string; city: string; state: string; locationLat?: number; locationLng?: number }) => {
      if (!user) throw new Error("User not authenticated");
      await updateDoc(doc(db, "users", user.uid), {
        name: data.name.trim(),
        whatsappNumber: data.whatsappNumber.trim() || "",
        pincode: data.pincode.trim() || "",
        city: data.city.trim() || "",
        state: data.state.trim() || "",
        locationLat: typeof data.locationLat === "number" ? data.locationLat : null,
        locationLng: typeof data.locationLng === "number" ? data.locationLng : null,
      });
    },
    onSuccess: async () => {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Refresh user data in auth hook
      await refreshUserData();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    updateProfileMutation.mutate({ name, whatsappNumber, pincode, city, state });
  };

  const handleUseCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      const detected = await detectAndSaveLocation();
      setPincode(detected.pincode || "");
      setCity(detected.city || "");
      setState(detected.state || "");
      // Persist to Firestore immediately (so seller becomes discoverable).
      updateProfileMutation.mutate({
        name,
        whatsappNumber,
        pincode: detected.pincode || "",
        city: detected.city || "",
        state: detected.state || "",
        locationLat: detected.lat,
        locationLng: detected.lng,
      });
    } catch (e: any) {
      alert(e?.message || "Unable to fetch location. Please enter manually.");
    } finally {
      setDetectingLocation(false);
    }
  };

  if (authLoading || !user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Update your profile details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Profile updated successfully!</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={user.email || ""}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="pl-10"
                  disabled={updateProfileMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="whatsapp"
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="pl-10"
                  disabled={updateProfileMutation.isPending}
                />
              </div>
              <p className="text-xs text-gray-500">
                This will be used as the default WhatsApp number for your products
              </p>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-900">Location</h3>
                <p className="text-xs text-gray-500">
                  Used to show your business to buyers searching for nearby sellers.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleUseCurrentLocation}
                disabled={detectingLocation || updateProfileMutation.isPending}
              >
                {detectingLocation ? "Fetching location..." : "Use current location"}
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    inputMode="numeric"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 423651"
                    disabled={updateProfileMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Nashik"
                    disabled={updateProfileMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    disabled={updateProfileMutation.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="px-3 py-2 bg-gray-50 rounded-md border">
                <span className="text-sm font-medium capitalize text-gray-700">
                  {userData.role}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Role cannot be changed. Contact an administrator to change your role.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="min-w-[120px]"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setName(userData.name || "");
                  setWhatsappNumber(userData.whatsappNumber || "");
                  setPincode(userData.pincode || "");
                  setCity(userData.city || "");
                  setState(userData.state || "");
                }}
                disabled={updateProfileMutation.isPending}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">Account Created</span>
            <span className="text-sm font-medium">
              {userData.createdAt
                ? new Date(userData.createdAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-gray-600">User ID</span>
            <span className="text-sm font-mono text-gray-500 text-xs">
              {user.uid.substring(0, 8)}...
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
