export type Mode = 'customer' | 'admin';
export type CustomerView = 'home' | 'shop' | 'appointments' | 'stores';
export type AdminView = 'overview' | 'products' | 'orders' | 'customers' | 'lens' | 'analytics' | 'suppliers' | 'reports';
export type Modal = 'product' | 'cart' | 'account' | 'appointment' | 'support' | 'prescription' | null;

export interface Product {
  id: string;
  name: string;
  code: string;
  brand: string;
  price: number;
  mrp: number;
  shape: string;
  size: string;
  colors: string[];
  stock: number;
  category: string;
  lens: string[];
  tag?: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
  lens: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  tone?: 'success' | 'info' | 'warning';
}

export interface Order {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status: 'Packed' | 'Processing' | 'Delivered' | 'Ready for pickup';
  items: number;
}
