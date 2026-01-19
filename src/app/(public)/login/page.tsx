"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import auth from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ShoppingBag, Loader2, AlertCircle, Store, ShoppingCart, MessageCircle, Shield } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import db from "@/lib/firebase/firestore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User data not found");
    }

    const { role } = userSnap.data();

    if (role === "admin") {
      router.push("/admin/dashboard");
    } else if (role === "seller") {
      router.push("/seller/dashboard");
    } else {
      router.push("/");
    }
  } catch (err: any) {
    setError(
      err.code === "auth/invalid-credential"
        ? "Invalid email or password"
        : err.code === "auth/user-not-found"
        ? "No account found with this email"
        : err.code === "auth/wrong-password"
        ? "Incorrect password"
        : "Failed to sign in. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Branding & benefits — same as signup */}
      <div className="lg:w-[44%] xl:w-[480px] lg:min-h-screen flex-shrink-0 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 lg:mb-10">
          <ShoppingBag className="h-8 w-8 sm:h-9 sm:w-9 text-blue-200" />
          <span className="text-xl sm:text-2xl font-bold">BharatMart</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
          Welcome back to BharatMart
        </h1>
        <p className="mt-3 sm:mt-4 text-blue-100 text-sm sm:text-base max-w-md">
          Sign in to shop from local sellers, manage your products, or access your dashboard.
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
              <p className="text-sm text-blue-200">Your data is safe. Sign in anytime to continue where you left off.</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile/tablet: compact header */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-2">
              <ShoppingBag className="h-7 w-7 text-blue-600" />
              <span className="text-xl font-bold text-blue-600">BharatMart</span>
            </Link>
            <h2 className="text-xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="text-sm text-gray-500 mt-1">Enter your email and password to continue.</p>
          </div>

          <Card className="shadow-lg border border-gray-200/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to access your account or dashboard.
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

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
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
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign up
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
