import React, { createContext, useContext, useEffect, useState } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isFirstLaunch: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setupPassword: (password: string) => Promise<void>;
  changePassword: (currentPwd: string, newPwd: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getItem<string>(STORAGE_KEYS.AUTH_PASSWORD);
      setIsFirstLaunch(!stored);
      setIsLoading(false);
    })();
  }, []);

  async function login(password: string): Promise<boolean> {
    const stored = await getItem<string>(STORAGE_KEYS.AUTH_PASSWORD);
    if (password === stored) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }

  function logout() {
    setIsAuthenticated(false);
  }

  async function setupPassword(password: string): Promise<void> {
    await setItem(STORAGE_KEYS.AUTH_PASSWORD, password);
    setIsFirstLaunch(false);
    setIsAuthenticated(true);
  }

  async function changePassword(currentPwd: string, newPwd: string): Promise<boolean> {
    const stored = await getItem<string>(STORAGE_KEYS.AUTH_PASSWORD);
    if (currentPwd !== stored) return false;
    await setItem(STORAGE_KEYS.AUTH_PASSWORD, newPwd);
    return true;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isFirstLaunch,
        isLoading,
        login,
        logout,
        setupPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
