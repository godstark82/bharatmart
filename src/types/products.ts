export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];       
  price: number;
  categoryId: string;     
  status: "active" | "inactive";
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}
