import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  status: string;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  hasPermission: (requiredPermission: string) => boolean;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (userData, token) => {
    localStorage.setItem('token', token);
    set({ user: userData, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  hasPermission: (requiredPermission) => {
    const { user, isAuthenticated } = get();
    if (!isAuthenticated || !user) return false;
    
    if (user.role === 'ADMIN') return true;
    
    if (user.role === 'STAFF' && user.permissions) {
      return user.permissions.includes(requiredPermission);
    }
    
    return false;
  },
}));

export default useAuthStore;
