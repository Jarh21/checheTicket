import React, { createContext, useContext, useEffect, useState } from 'react';
import type { LicenseSession } from '@workspace/api-client-react';
import {
  loginWithLicense,
  logoutLicenseSession,
  restoreLicenseSession,
} from '@/services/license';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: LicenseSession | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  biometricLogin: () => Promise<{ ok: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const apiMessage = error.message.match(/HTTP \d+ [^:]+:\s*(.+)$/)?.[1];
    if (apiMessage) return apiMessage;
    if (error.message.includes('401')) return 'Correo, contraseña o licencia inválidos';
    if (error.message.includes('403')) return 'La licencia no permite acceder desde este dispositivo';
    return 'No se pudo verificar la licencia. Revisa tu conexión a internet';
  }
  return 'No se pudo iniciar sesión';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LicenseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void restoreLicenseSession().then((restored) => {
      if (mounted) {
        setSession(restored);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      void restoreLicenseSession().then((refreshed) => {
        setSession(refreshed);
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session?.license.id]);

  async function login(email: string, password: string) {
    try {
      const nextSession = await loginWithLicense(email, password);
      setSession(nextSession);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  }

  async function biometricLogin() {
    try {
      const restored = await restoreLicenseSession();
      if (restored) {
        setSession(restored);
        return { ok: true };
      }
      return { ok: false, message: 'La sesión ha vencido. Inicia sesión con tu correo y contraseña.' };
    } catch (error) {
      return { ok: false, message: errorMessage(error) };
    }
  }

  async function logout() {
    await logoutLicenseSession();
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(session),
        isLoading,
        session,
        login,
        logout,
        biometricLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
