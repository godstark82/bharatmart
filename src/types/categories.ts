export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
 icon?: string;  
 
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}