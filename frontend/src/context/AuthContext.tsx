import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  phone: string;
  address: string;
  walletAddress: string;
  aadhaarNumber: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    const { token, email: userEmail, role, fullName, userId, aadhaarNumber } = response.data.data;
    const userData = {
      id: userId, fullName, email: userEmail, role,
      phone: '', address: '', walletAddress: '',
      aadhaarNumber: aadhaarNumber || ''
    };
    setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const googleLogin = async (idToken: string) => {
    const response = await authAPI.googleLogin(idToken);
    const { token, email: userEmail, role, fullName, userId, aadhaarNumber } = response.data.data;
    const userData = { 
      id: userId, fullName, email: userEmail, role,
      phone: '', address: '', walletAddress: '',
      aadhaarNumber: aadhaarNumber || ''
    };
    setToken(token);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, googleLogin, logout,
      isAuthenticated: !!token,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};