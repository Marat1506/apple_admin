import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get token from localStorage first, then from cookies
    let token = localStorage.getItem('admin_token');
    if (!token) {
      // Try to get from cookies as fallback
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('admin_token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
        // Restore to localStorage for consistency
        localStorage.setItem('admin_token', token);
      }
    }
    
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      // Handle wrapped response from TransformInterceptor
      const userData = response.data.data || response.data;
      
      if (userData.role === 'admin') {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Backend wraps response in { data: {...}, timestamp }
    const responseData = response.data.data || response.data;
    const { access_token, user: userData } = responseData;
    
    if (!userData) {
      throw new Error('Invalid response: user data missing');
    }
    
    if (userData.role !== 'admin') {
      throw new Error('Access denied. Admin privileges required.');
    }
    
    localStorage.setItem('admin_token', access_token);
    // Also save to cookies for persistence
    document.cookie = `admin_token=${access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    // Also remove from cookies
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
