import AdminNavbar from "@/components/admin/Navbar";
import AdminSidebarMobile from "../../components/admin/Sidebar";

export const metadata = {
  title: "Admin | BharatMart",
  robots: "noindex, nofollow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navbar */}
      <AdminNavbar />

      {/* Mobile Menu Button */}
      <div className="flex items-center border-b bg-white px-4 h-14 md:hidden">
        <AdminSidebarMobile />
        <span className="ml-3 font-semibold text-sm">
         Admin
        </span>
      </div>

      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
