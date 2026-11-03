import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/auth';
import { loginApi, registerApi, refreshTokenApi, logoutApi, getMeApi } from '../api/auth';
import { setAccessToken } from '../lib/axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {
    throw new Error('useAuth must be used within an AuthProvider');
  },
  register: async () => {
    throw new Error('useAuth must be used within an AuthProvider');
  },
  logout: async () => {},
  updateUser: () => {},
  refreshUser: async () => {},
};

let sessionRestorePromise: Promise<LoginResponse | null> | null = null;

export const resetSessionRestorePromise = () => {
  sessionRestorePromise = null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Silent session restore on initial app boot via HttpOnly cookie (deduplicated against React StrictMode)
  useEffect(() => {
    let active = true;

    if (!sessionRestorePromise) {
      sessionRestorePromise = refreshTokenApi()
        .then((res) => res)
        .catch(() => null);
    }

    sessionRestorePromise
      .then((response) => {
        if (!active) return;
        if (response?.access && response?.user) {
          setAccessToken(response.access);
          setUser(response.user);
        } else {
          setAccessToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    const handleSessionExpired = () => {
      sessionRestorePromise = null;
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      active = false;
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<User> => {
    setIsLoading(true);
    sessionRestorePromise = null;
    try {
      const response = await loginApi(credentials);
      setAccessToken(response.access);
      setUser(response.user);
      return response.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<RegisterResponse> => {
    return await registerApi(data);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    sessionRestorePromise = null;
    try {
      await logoutApi();
    } catch (err) {
      console.warn('Logout network notice:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const refreshed = await getMeApi();
      setUser(refreshed);
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  return context || defaultAuthContext;
};

export default AuthContext;
