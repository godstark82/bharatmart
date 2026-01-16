"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { title: "Dashboard", href: "/admin/dashboard" },
  { title: "Categories", href: "/admin/categories" },
  { title: "Products", href: "/admin/products" },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <header className="hidden md:block border-b bg-white">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-10">
            <span className="text-xl font-semibold text-blue-600">
              BharatMart
            </span>

            {/* Navigation */}
            <NavigationMenu>
              <NavigationMenuList className="gap-6">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <NavigationMenuItem key={item.href}>
                      <Link
                        href={item.href}
                        className={clsx(
                          "text-sm font-medium transition",
                          active
                            ? "text-blue-600"
                            : "text-gray-600 hover:text-gray-900"
                        )}
                      >
                        {item.title}
                      </Link>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Admin Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Admin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
