import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { User } from "../types/api";
import * as authApi from "../lib/auth-api";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
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

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (!t) setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setTokenState(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const data = await authApi.signUp({ email, password, name });
      setTokenState(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendOtp = useCallback(async (phone: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      await authApi.sendOtp(token, phone);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const verifyOtp = useCallback(async (code: string) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const updated = await authApi.verifyOtp(token, code);
      setUser(updated);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const verifyEmail = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const updated = await authApi.verifyEmail(token);
      setUser(updated);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const logout = useCallback(() => {
    setTokenState(null);
    setUser(null);
  }, []);

  const getAuthHeaders = useCallback(() => {
    return token ? authApi.getAuthHeaders(token) : {};
  }, [token]);

  const value: AuthContextValue = useMemo(
    () => ({
      token,
      user,
      isLoading,
      login,
      signUp,
      sendOtp,
      verifyOtp,
      verifyEmail,
      logout,
      setToken,
      setUser,
      getAuthHeaders,
    }),
    [token, user, isLoading, login, signUp, sendOtp, verifyOtp, verifyEmail, logout, setToken, getAuthHeaders]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
