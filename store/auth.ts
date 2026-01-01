import { create } from 'zustand';

interface UserProfile {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
  accessToken?: string;
}

interface AuthState {
  token: string | null;
  role: 'USER' | 'ADMIN' | null;
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isInitialized: boolean;
  setAuth: (token: string, role: 'USER' | 'ADMIN', userId: string, email?: string) => void;
  updateUserProfile: (profile: UserProfile) => void;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  userId: null,
  email: null,
  firstName: null,
  lastName: null,
  phone: null,
  isInitialized: false,
  setAuth: (token, role, userId, email) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    if (email) {
      localStorage.setItem('email', email);
    }
    set({ token, role, userId, email: email || null, isInitialized: true });
  },
  updateUserProfile: (profile) => {
    localStorage.setItem('email', profile.email);
    if (profile.firstName) localStorage.setItem('firstName', profile.firstName);
    if (profile.lastName) localStorage.setItem('lastName', profile.lastName);
    if (profile.phone) localStorage.setItem('phone', profile.phone);
    
    // Update token if provided (from /auth/me endpoint)
    if (profile.accessToken) {
      localStorage.setItem('token', profile.accessToken);
    }
    
    // Get current token to preserve it if no new token is provided
    const currentToken = useAuthStore.getState().token;
    
    set({
      email: profile.email,
      firstName: profile.firstName || null,
      lastName: profile.lastName || null,
      phone: profile.phone || null,
      role: profile.role,
      userId: profile.userId,
      // Use new token if provided, otherwise keep current token
      token: profile.accessToken || currentToken,
    });
  },
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('phone');
    set({
      token: null,
      role: null,
      userId: null,
      email: null,
      firstName: null,
      lastName: null,
      phone: null,
      isInitialized: true,
    });
  },
  initAuth: () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') as 'USER' | 'ADMIN' | null;
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    const phone = localStorage.getItem('phone');
    if (token && role && userId) {
      set({
        token,
        role,
        userId,
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        isInitialized: true,
      });
    } else {
      set({ isInitialized: true });
    }
  },
}));
