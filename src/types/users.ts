export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'seller';
  name: string;
  whatsappNumber?: string;
  createdAt: Date;
}