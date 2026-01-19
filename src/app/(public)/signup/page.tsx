"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import auth from "@/lib/firebase/auth";
import db from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ShoppingBag, Loader2, AlertCircle, Store, ShoppingCart, MessageCircle, Shield } from "lucide-react";

export default function SignupPage() {
  const [accountType, setAccountType] = useState<"buyer" | "seller">("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Create user document in Firestore with seller role by default
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        name: name.trim(),
        role: accountType,
        whatsappNumber: whatsappNumber.trim() || "",
        businessName: "",
        shopNo: "",
        gstNumber: "",
        houseNo: "",
        floorNo: "",
        blockNo: "",
        buildingName: "",
        area: "",
        landmark: "",
        country: "India",
        pincode: "",
        city: "",
        state: "",
        locationLat: null,
        locationLng: null,
        createdAt: serverTimestamp(),
      });

      router.push(accountType === "seller" ? "/seller/dashboard" : "/");
    } catch (err: any) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "An account with this email already exists"
          : err.code === "auth/invalid-email"
          ? "Invalid email address"
          : err.code === "auth/weak-password"
          ? "Password is too weak"
          : "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Branding & benefits — full height on desktop, compact on mobile */}
      <div className="lg:w-[44%] xl:w-[480px] lg:min-h-screen flex-shrink-0 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 lg:mb-10">
          <ShoppingBag className="h-8 w-8 sm:h-9 sm:w-9 text-blue-200" />
          <span className="text-xl sm:text-2xl font-bold">BharatMart</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
          Join India&apos;s local marketplace
        </h1>
        <p className="mt-3 sm:mt-4 text-blue-100 text-sm sm:text-base max-w-md">
          Whether you want to shop from nearby sellers or list your own products — get started in minutes.
        </p>
        <ul className="mt-6 sm:mt-8 lg:mt-10 space-y-3 sm:space-y-4">
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <ShoppingCart className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium">Shop as a buyer</p>
              <p className="text-sm text-blue-200">Add to cart, checkout via WhatsApp, get deals from local sellers.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Store className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium">Sell as a seller</p>
              <p className="text-sm text-blue-200">List products, reach nearby buyers, grow your business.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium">WhatsApp checkout</p>
              <p className="text-sm text-blue-200">Quick, familiar checkout — order via BharatMart WhatsApp.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium">Secure & simple</p>
              <p className="text-sm text-blue-200">Your data is safe. No complex setup — just sign up and go.</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Right: Signup form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile/tablet: compact header */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-2">
              <ShoppingBag className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-bold text-blue-600">BharatMart</span>
            </Link>
            <h2 className="text-xl font-bold text-gray-900">Create your account</h2>
            <p className="text-sm text-gray-500 mt-1">Choose buyer or seller and sign up in a minute.</p>
          </div>

          <Card className="shadow-lg border border-gray-200/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Sign up</CardTitle>
              <CardDescription>
                Choose your account type and fill in your details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Account type */}
                <div className="space-y-2">
                  <Label>Sign up as</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={accountType === "buyer" ? "default" : "outline"}
                      className="h-11"
                      onClick={() => setAccountType("buyer")}
                      disabled={loading}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buyer
                    </Button>
                    <Button
                      type="button"
                      variant={accountType === "seller" ? "default" : "outline"}
                      className="h-11"
                      onClick={() => setAccountType("seller")}
                      disabled={loading}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Seller
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {accountType === "seller"
                      ? "List products and appear in nearby sellers."
                      : "Add to cart, checkout, and shop from local sellers."}
                  </p>
                </div>

                {/* Name + Email: 2-col on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={loading}
                    autoComplete="tel"
                  />
                  <p className="text-xs text-gray-500">Used as default for your product listings (sellers).</p>
                </div>

                {/* Password + Confirm: 2-col on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Same as above"
                      required
                      disabled={loading}
                      autoComplete="new-password"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Admin accounts are created by administrators only.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>

          <p className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
