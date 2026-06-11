import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getMe } from '../lib/api';
import { getAuthData, setAuthData, clearAuthData } from '../lib/utils';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { token, user: storedUser } = getAuthData();
      if (token && storedUser) {
        try {
          const response = await getMe();
          setUser(response.data);
          localStorage.setItem('doorguard_user', JSON.stringify(response.data));
        } catch (error) {
          clearAuthData();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const loginUser = useCallback((token, userData) => {
    setAuthData(token, userData);
    setUser(userData);
  }, []);

  const logoutUser = useCallback(() => {
    clearAuthData();
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('doorguard_user', JSON.stringify(userData));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getMe();
      setUser(response.data);
      localStorage.setItem('doorguard_user', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      loginUser,
      logoutUser,
      updateUser,
      refreshUser,
      isAuthenticated: !!user,
      isClient: user?.role === 'client',
      isTrainer: user?.role === 'trainer',
    }),
    [user, loading, loginUser, logoutUser, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
