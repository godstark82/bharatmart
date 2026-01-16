export interface User {
  id: string;
  email: string;
  role: 'admin' | 'seller' | 'buyer';
  name: string;
  createdAt: Date;
}