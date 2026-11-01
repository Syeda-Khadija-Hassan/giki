/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: any) => Promise<UserProfile>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  switchDemoAccount: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('giki_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.getMe();
      setUser(profile);
    } catch {
      localStorage.removeItem('giki_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('giki_token', res.access_token);
      setToken(res.access_token);
      const profile = await api.getMe();
      setUser(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any): Promise<UserProfile> => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      localStorage.setItem('giki_token', res.access_token);
      setToken(res.access_token);
      const profile = await api.getMe();
      setUser(profile);
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('giki_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile();
    }
  };

  const switchDemoAccount = async (role: UserRole) => {
    if (role === 'STUDENT') {
      await login('u2024626@giki.edu.pk', 'student123');
    } else if (role === 'WARDEN') {
      await login('warden@giki.edu.pk', 'warden123');
    } else if (role === 'SECURITY') {
      await login('security@giki.edu.pk', 'security123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        switchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
