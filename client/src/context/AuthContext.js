import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(data => setUser(data))
        .catch(() => { localStorage.removeItem('token'); setToken(null); setUser(null); });
    }
  }, [token]);

  const refreshCartCount = () => {
    if (token && user) {
      api.get('/users/cart').then(items => setCartCount(items.length)).catch(() => setCartCount(0));
    } else {
      setCartCount(0);
    }
  };

  useEffect(refreshCartCount, [user]);

  const login = (tokenValue, userData) => {
    localStorage.setItem('token', tokenValue);
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCartCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin: user?.role === 'admin', cartCount, refreshCartCount }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);