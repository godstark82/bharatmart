"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Tags, Boxes, Package, User } from "lucide-react";
import clsx from "clsx";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("admin" | "seller")[];
}

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "seller"],
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: Tags,
    roles: ["admin"],
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Boxes,
    roles: ["admin"],
  },
  {
    label: "My Products",
    href: "/seller/products",
    icon: Package,
    roles: ["seller"],
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
    roles: ["admin", "seller"],
  },
];

function SidebarContent({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { role } = useAuth();

  const filteredMenu = menuItems.filter((item) => item.roles.includes(role as "admin" | "seller"));

  return (
    <aside className={`${isMobile ? "" : "hidden md:block"} h-full bg-white border-r`}>
      <div className="px-6 py-5 border-b">
        <h1 className="text-lg font-bold text-blue-600">BharatMart</h1>
      </div>

      <nav className="px-3 py-4 space-y-1">
        {filteredMenu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors",
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
  );
}

export function DashboardSidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="m-4">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent isMobile />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
