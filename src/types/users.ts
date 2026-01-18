export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'seller';
  name: string;
  whatsappNumber?: string;
  // Location (used for "nearby sellers")
  pincode?: string;
  city?: string;
  state?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: Date;
}