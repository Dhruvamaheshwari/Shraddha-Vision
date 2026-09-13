import { create } from 'zustand';
import axios from 'axios';
import { Product } from '../types';

interface ProductState {
  frames: Product[];
  isLoading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  fetchFrames: (params?: { search?: string; category?: string; page?: number; limit?: number; includeInactive?: boolean }) => Promise<void>;
  createFrame: (frameData: Partial<Product>) => Promise<void>;
  updateFrame: (id: string, frameData: Partial<Product>) => Promise<void>;
  deleteFrame: (id: string) => Promise<void>;
}

const useProductStore = create<ProductState>((set, get) => ({
  frames: [],
  isLoading: false,
  error: null,
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,

  fetchFrames: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('http://localhost:5000/api/frames', { params });
      set({ 
        frames: response.data.frames, 
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        totalPages: response.data.totalPages,
        isLoading: false 
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch frames', isLoading: false });
    }
  },

  createFrame: async (frameData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/frames', frameData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchFrames();
    } catch (err: any) {
      throw err;
    }
  },

  updateFrame: async (id, frameData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5000/api/frames/${id}`, frameData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchFrames();
    } catch (err: any) {
      throw err;
    }
  },

  deleteFrame: async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/frames/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchFrames();
    } catch (err: any) {
      throw err;
    }
  }
}));

export default useProductStore;
