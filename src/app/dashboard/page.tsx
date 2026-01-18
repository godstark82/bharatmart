"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardRedirectPage() {
  const { user, loading, role, isAdmin, isSeller } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!role) {
      router.replace("/login");
      return;
    }
    if (isAdmin) {
      router.replace("/admin/dashboard");
      return;
    }
    if (isSeller) {
      router.replace("/seller/dashboard");
      return;
    }
    router.replace("/");
  }, [loading, user, role, isAdmin, isSeller, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}

