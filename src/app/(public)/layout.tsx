"use client";

import { usePathname } from "next/navigation";
import { MainNavbar } from "@/components/layout/MainNavbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbar = pathname === "/login" || pathname === "/signup";

  return (
    <div className="flex min-h-dvh flex-col">
      {!hideNavbar && <MainNavbar />}
      <main className="min-h-0 flex-1 flex flex-col">{children}</main>
    </div>
  );
}
