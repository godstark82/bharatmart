export interface User {
  uid: string;
  email: string;
  role: "admin" | "seller" | "buyer";
  name: string;
  whatsappNumber?: string;
  // Seller business info
  businessName?: string;
  shopNo?: string;
  gstNumber?: string;
  // Location (used for "nearby sellers")
  pincode?: string;
  city?: string;
  state?: string;
  locationLat?: number;
  locationLng?: number;
  // Full address (used for deliveries / seller business address)
  houseNo?: string;
  floorNo?: string;
  blockNo?: string;
  buildingName?: string;
  area?: string;
  landmark?: string;
  country?: string;
  createdAt: Date;
}