import { create } from 'zustand';
import axios from 'axios';
import { Product } from '../types';

interface ProductState {
  frames: Product[];
  isLoading: boolean;
  error: string | null;
  fetchFrames: () => Promise<void>;
}

const useProductStore = create<ProductState>((set) => ({
  frames: [],
  isLoading: false,
  error: null,

  fetchFrames: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('http://localhost:5000/api/frames');
      set({ frames: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch frames', isLoading: false });
    }
  },
}));

export default useProductStore;
