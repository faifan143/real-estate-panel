import { create } from 'zustand';

interface AuthState {
  token: string | null;
  role: 'USER' | 'ADMIN' | null;
  userId: string | null;
  setAuth: (token: string, role: 'USER' | 'ADMIN', userId: string) => void;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  userId: null,
  setAuth: (token, role, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    set({ token, role, userId });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    set({ token: null, role: null, userId: null });
  },
  initAuth: () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') as 'USER' | 'ADMIN' | null;
    const userId = localStorage.getItem('userId');
    if (token && role && userId) {
      set({ token, role, userId });
    }
  },
}));
