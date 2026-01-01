import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
});

// Store reference to clearAuth function to call when token expires
let clearAuthCallback: (() => void) | null = null;

export const setClearAuthCallback = (callback: () => void) => {
  clearAuthCallback = callback;
};

api.interceptors.request.use((config) => {
  // Always get fresh token from localStorage to ensure it's up to date
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('firstName');
      localStorage.removeItem('lastName');
      localStorage.removeItem('phone');
      
      // Clear Zustand store if callback is available
      if (clearAuthCallback) {
        clearAuthCallback();
      }
      
      toast.error('Session expired. Please login again.');
      
      // Only redirect if not already on login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status === 409) {
      toast.error(error.response?.data?.message || 'Conflict occurred.');
    }
    return Promise.reject(error);
  }
);
