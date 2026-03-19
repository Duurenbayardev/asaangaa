import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../types/api";
import * as authApi from "../lib/auth-api";

const AUTH_TOKEN_KEY = "@asaangaa/auth_token";
const AUTH_USER_KEY = "@asaangaa/auth_user";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isRestored: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, passwordConfirm: string, name?: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  logout: () => void;
  setToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  getAuthHeaders: () => Record<string, string>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(AUTH_USER_KEY),
        ]);
        if (!cancelled && storedToken) {
          setTokenState(storedToken);
          setUser(storedUser ? (JSON.parse(storedUser) as User) : null);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsRestored(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setToken = useCallback(
    (t: string | null) => {
      setTokenState(t);
      if (!t) {
        setUser(null);
        // Ensure stale sessions don't come back after app restart.
        void clearStoredAuth();
      }
    },
    [clearStoredAuth]
  );

  const persistAuth = useCallback(async (accessToken: string, userData: User) => {
    await Promise.all([
      AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken),
      AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData)),
    ]);
  }, []);

  const clearStoredAuth = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(AUTH_USER_KEY),
      ]);
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const data = await authApi.login({ email, password });
        setTokenState(data.accessToken);
        setUser(data.user);
        await persistAuth(data.accessToken, data.user);
      } finally {
        setIsLoading(false);
      }
    },
    [persistAuth]
  );

  const signUp = useCallback(
    async (email: string, password: string, passwordConfirm: string, name?: string) => {
      setIsLoading(true);
      try {
        const data = await authApi.signUp({ email, password, passwordConfirm, name });
        setTokenState(data.accessToken);
        setUser(data.user);
        await persistAuth(data.accessToken, data.user);
      } finally {
        setIsLoading(false);
      }
    },
    [persistAuth]
  );

  const sendVerificationEmail = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      await authApi.sendVerificationEmail(token);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const verifyEmail = useCallback(async (code: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const updated = await authApi.verifyEmailWithCode(token, code);
      setUser(updated);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const logout = useCallback(() => {
    // Use the same path as forced-logout/401 so storage is always cleared.
    setToken(null);
  }, [setToken]);

  const getAuthHeaders = useCallback(() => {
    return token ? authApi.getAuthHeaders(token) : {};
  }, [token]);

  const value: AuthContextValue = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isRestored,
      login,
      signUp,
      sendVerificationEmail,
      verifyEmail,
      logout,
      setToken,
      setUser,
      getAuthHeaders,
    }),
    [token, user, isLoading, isRestored, login, signUp, sendVerificationEmail, verifyEmail, logout, setToken, setUser, getAuthHeaders]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
