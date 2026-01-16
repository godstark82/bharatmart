"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, Tags, Boxes } from "lucide-react";
import clsx from "clsx";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const menu = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Products", href: "/admin/products", icon: Boxes },
];

export default function AdminSidebarMobile() {
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <button
            aria-label="Open menu"
            className="p-2 rounded-md border hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="w-64 p-0">
          <aside className="h-full bg-white">
            <div className="px-6 py-5 border-b">
              <h1 className="text-lg font-bold text-blue-600">
                BharatMart
              </h1>
              
            </div>

            <nav className="px-3 py-4 space-y-1">
              {menu.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium",
                      active
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </SheetContent>
      </Sheet>
    </div>
  );
}
