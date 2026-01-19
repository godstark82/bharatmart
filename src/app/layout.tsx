import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { InquiryProvider } from "@/lib/providers/InquiryProvider";
import { CategoriesProvider } from "@/lib/providers/CategoriesProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BharatMart - Product Marketplace",
  description: "Browse products and checkout your cart via WhatsApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <QueryProvider>
          <InquiryProvider>
            <CategoriesProvider>
              {children}
              <Toaster position="top-center" richColors />
            </CategoriesProvider>
          </InquiryProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
