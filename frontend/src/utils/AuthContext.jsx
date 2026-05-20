import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      try {
        const response = await authAPI.me();
        setUser(response.data.user || response.data.data);
        setIsAuthenticated(true);
        // Update saved user
        localStorage.setItem('user', JSON.stringify(response.data.user || response.data.data));
      } catch (error) {
        // Only clear auth if it's an authentication error (401/403)
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Token invalid or expired - clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        } else if (error.isNetworkError) {
          // Network error - use saved user temporarily to allow access
          // This prevents logout on refresh when server is temporarily unavailable
          console.warn('Network error during auth check, using saved user:', error.message);
          try {
            const user = JSON.parse(savedUser);
            setUser(user);
            setIsAuthenticated(true);
          } catch (parseError) {
            // If saved user is invalid, clear it
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Other errors - try to use saved user first
          try {
            const user = JSON.parse(savedUser);
            setUser(user);
            setIsAuthenticated(true);
            console.warn('Auth check failed but using saved user:', error.message);
          } catch (parseError) {
            // If saved user is invalid, clear everything
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
    } else if (savedUser) {
      // If there's saved user but no token, try to use it
      try {
        const user = JSON.parse(savedUser);
        setUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    setIsLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.isNetworkError 
          ? (error.message || 'Tidak dapat terhubung ke server. Pastikan backend server sedang berjalan.')
          : (error.response?.data?.error || 'Login gagal')
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}