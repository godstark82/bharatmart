export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];       
  price: number;
  categoryId: string;
  sellerId: string;
  whatsappNumber?: string; // Override seller's WhatsApp if provided
  // Product Metadata
  sku?: string; // Stock Keeping Unit / Product Code
  stock?: number; // Available quantity
  status?: "active" | "inactive" | "out_of_stock"; // Product status
  featured?: boolean; // Featured product flag
  tags?: string[]; // Product tags/keywords
  features?: string[]; // Product features list
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}
