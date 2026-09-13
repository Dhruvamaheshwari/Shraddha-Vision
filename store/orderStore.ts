import { create } from 'zustand';
import axios from 'axios';

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerMobile?: string;
  items: any[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress?: any;
  billingAddress?: any;
  timeline?: any[];
  createdAt: string;
  customer?: any;
}

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  counts: { toFulfil: number; ready: number; returns: number; all: number };
  fetchOrders: (params?: { search?: string; status?: string; tab?: string; page?: number; limit?: number }) => Promise<void>;
  fetchOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  createOrder: (data: any) => Promise<any>;
}

const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeOrder: null,
  isLoading: false,
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
  counts: { toFulfil: 0, ready: 0, returns: 0, all: 0 },

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/orders', { 
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ 
        orders: response.data.orders, 
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
        counts: response.data.counts || { toFulfil: 0, ready: 0, returns: 0, all: 0 },
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch orders', isLoading: false });
    }
  },

  fetchOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ activeOrder: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5000/api/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (get().activeOrder?._id === id) {
        set({ activeOrder: response.data });
      }
    } catch (err: any) {
      throw err;
    }
  },

  createOrder: async (data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/orders', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err: any) {
      throw err;
    }
  }
}));

export default useOrderStore;
