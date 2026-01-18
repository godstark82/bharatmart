import type { CartItem } from "@/lib/providers/InquiryProvider";
import type { StoredLocation } from "@/lib/location";

export type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: CartItem[];
  totalQty: number;
  totalAmount: number;
  deliveryAddress?: StoredLocation | null;
  createdAt: Date;
}

